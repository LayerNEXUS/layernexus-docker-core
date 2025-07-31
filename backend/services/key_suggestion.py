import logging
from typing import Dict, List, Optional, Set, Tuple
from collections import defaultdict
import pandas as pd
from backend.models.schema_models import ColumnProfile, TableProfile, RelationshipCandidate

logger = logging.getLogger(__name__)

class KeyPrioritizer:
    def __init__(self, 
                 custom_aliases: Dict[str, List[str]] = None,
                 min_alias_overlap: float = 0.7):
        self.type_priority = {
            'INT': 100, 'BIGINT': 95, 'UUID': 90, 'VARCHAR': 70, 'TEXT': 60, 'CHAR': 65
        }
        self.key_patterns = {
            'primary': set(),
            'foreign': set()
        }
        self.common_aliases = {
            'user': ['client', 'customer'],
            'product': ['item', 'sku'],
            **(custom_aliases or {})
        }
        self.detected_aliases = defaultdict(set)
        self.min_alias_overlap = min_alias_overlap
        self.user_confirmed_aliases = defaultdict(set)

    def suggest_relationships(self, schema: Dict[str, TableProfile], user_aliases: Dict[str, List[str]] = None):
        # First discover patterns from the data
        self._discover_key_patterns(schema)  # This must be called first!
        
        # Then process aliases and relationships
        if user_aliases:
            self._update_user_aliases(user_aliases)
        self._detect_aliases(schema)
        
        return self._find_all_relationships(schema)

    def _find_primary_key_candidates(self, schema: Dict[str, TableProfile]) -> Dict[str, ColumnProfile]:
        """Identify best PK candidate for each table"""
        pk_map = {}
        self.missing_pk_tables = []

        for table_name, table in schema.items():
            pk = self._get_best_pk_candidate(table)
            if pk:
                pk_map[table_name] = pk
            else:
                self.missing_pk_tables.append(table_name)
        
        return pk_map

    def _get_best_pk_candidate(self, table: TableProfile) -> Optional[ColumnProfile]:
        candidates = []
        for col_name, col_meta in table.columns.items():
            if self._is_primary_key_candidate(col_name, col_meta):
                score = self._score_primary_key(col_meta)
                if score >= 50:  # Only allow strong PKs
                    candidates.append((score, col_meta))

        return max(candidates, key=lambda x: x[0])[1] if candidates else None

    def _is_primary_key_candidate(self, col_name: str, col_meta: ColumnProfile) -> bool:
        """More flexible PK detection"""
        if col_meta.unique_ratio == 1 and len(set(col_meta.sample_values)) <= 1:
            logger.info(f"🛑 Skipping fake PK: {col_name} (constant value)")
            return False
        # Remove hardcoded pattern check - we now use discovered patterns
        return (
            col_meta.unique_ratio == 1.0 and
            col_meta.null_percent == 0.0 and
            col_meta.detected_type in self.type_priority
        )

    def _score_primary_key(self, col_meta: ColumnProfile) -> float:
        """Score PK candidates with discovered patterns"""
        type_score = self.type_priority.get(col_meta.detected_type.split('(')[0], 50)
        
        # Score based on discovered patterns
        name_score = max(
            100 if pattern in col_meta.name.lower() else 0
            for pattern in self.key_patterns['primary']
        ) if self.key_patterns['primary'] else 50
        
        return (type_score * 0.6) + (name_score * 0.4)

    def _update_user_aliases(self, user_aliases: Dict[str, List[str]]):
        """Store user-confirmed aliases with higher confidence"""
        for base_name, aliases in user_aliases.items():
            self.user_confirmed_aliases[base_name].update(aliases)
            self.common_aliases[base_name] = list(
                set(self.common_aliases.get(base_name, [])) | set(aliases)
            )

    def _get_active_aliases(self) -> Dict[str, List[str]]:
        """Combines all alias sources for debugging"""
        return {
            **self.common_aliases,
            **{k: list(v) for k, v in self.detected_aliases.items()},
            **{k: list(v) for k, v in self.user_confirmed_aliases.items()}
        }

    def _detect_aliases(self, schema: Dict[str, TableProfile]):
        """Dynamic alias detection with overlap threshold"""
        value_groups = defaultdict(list)
        
        for table in schema.values():
            for col_name, col in table.columns.items():
                if not self._could_be_foreign_key(col_name, col):
                    continue
                    
                values = [str(v).lower().strip() for v in col.sample_values if pd.notna(v)]
                if values:
                    fingerprint = frozenset(values[:100])
                    value_groups[fingerprint].append((table.name, col_name))
        
        for group in value_groups.values():
            if len(group) > 1:
                base_name = self._find_common_base([col for _, col in group])
                if base_name:
                    for _, col in group:
                        self.detected_aliases[base_name].add(col)

    def _find_common_base(self, column_names: List[str]) -> Optional[str]:
        """Extract common prefix/suffix from column names"""
        from os.path import commonprefix
        stripped = [name.replace('_id', '').replace('_fk', '') for name in column_names]
        return commonprefix(stripped) or None

    def _find_all_relationships(self, schema: Dict[str, TableProfile]) -> List[RelationshipCandidate]:
        """Generate all relationship candidates"""
        candidates = []
        pk_candidates = self._find_primary_key_candidates(schema)
        
        for src_table, src_profile in schema.items():
            for tgt_table, tgt_profile in schema.items():
                if src_table == tgt_table:
                    continue
                    
                tgt_pk = pk_candidates.get(tgt_table)
                if not tgt_pk or tgt_pk.unique_ratio < 1.0 or tgt_pk.null_percent > 0.0:
                    continue
                
                candidates.extend(
                    self._find_foreign_candidates(src_profile, tgt_profile, tgt_pk)
                )
        
        return sorted(candidates, key=lambda x: (-x.confidence, x.reason))

    def _find_foreign_candidates(self, 
                              source: TableProfile, 
                              target: TableProfile,
                              target_pk: ColumnProfile) -> List[RelationshipCandidate]:
        """Find FK candidates with confidence scoring"""
        candidates = []
        
        for src_col, src_meta in source.columns.items():
            if not self._could_be_foreign_key(src_col, src_meta):
                continue
                
            # Check all alias sources
            for alias_source, confidence_boost in [
                (self.user_confirmed_aliases, 0.95),
                # (self.common_aliases, 0.9),
                (self.detected_aliases, 0.8)
            ]:
                for base_name, aliases in alias_source.items():
                    if self._matches_alias(src_col, base_name, aliases):
                        candidates.append(
                            self._create_relationship(
                                source=source,
                                src_col=src_col,
                                target=target,
                                tgt_col=target_pk.name,
                                confidence=confidence_boost,
                                reason=f"{'user_' if confidence_boost == 0.95 else ''}alias_match"
                            )
                        )
                        break
            
            # Direct match fallback
            if self._is_direct_foreign_match(src_col, target_pk.name, target.name):
                candidates.append(
                    self._create_relationship(
                        source=source,
                        src_col=src_col,
                        target=target,
                        tgt_col=target_pk.name,
                        confidence=0.97,
                        reason='direct_match'
                    )
                )
            # NEW: Name and type exact match (auto inference)
            if (
                src_col == target_pk.name and
                src_meta.detected_type == target_pk.detected_type
            ):
                candidates.append(
                    self._create_relationship(
                        source=source,
                        src_col=src_col,
                        target=target,
                        tgt_col=target_pk.name,
                        confidence=0.88,
                        reason='name_and_type_match'
                    )
                )
        
        return candidates

    def _matches_alias(self, column_name: str, base_name: str, aliases: Set[str]) -> bool:
        """Check if column matches an alias pattern"""
        col_base = column_name.lower().replace('_id', '').replace('_fk', '')
        return (col_base in aliases or any(alias in column_name.lower() for alias in aliases))

    def _could_be_foreign_key(self, col_name: str, col_meta: ColumnProfile) -> bool:
        """More flexible FK detection"""
        # Check if matches any discovered patterns OR has key-like properties
        return (
            any(p in col_name.lower() for p in self.key_patterns['foreign']) or
            (
                0.3 < col_meta.unique_ratio < 0.95 and
                col_meta.null_percent < 0.2 and
                col_meta.detected_type in self.type_priority
            )
        )

    def _is_direct_foreign_match(self, src_col: str, target_pk_name: str, target_table: str) -> bool:
        """Exact name pattern matching"""
        expected_prefix = src_col.replace('_id', '')
        return (target_pk_name == 'id' and expected_prefix in target_table.lower())

    def _create_relationship(self, 
                           source: TableProfile,
                           src_col: str,
                           target: TableProfile,
                           tgt_col: str,
                           confidence: float,
                           reason: str) -> RelationshipCandidate:
        """Create a RelationshipCandidate object"""
        return RelationshipCandidate(
            source_table=source.name,
            source_column=src_col,
            target_table=target.name,
            target_column=tgt_col,
            confidence=confidence,
            match_type='inferred',
            reason=reason
        )
    
    def _discover_key_patterns(self, schema: Dict[str, TableProfile]):
        """Extract key patterns from column names"""
        for table in schema.values():
            for col_name, col in table.columns.items():
                # Discover primary key patterns
                if (col.unique_ratio == 1.0 
                    and col.null_percent == 0.0
                    and col.detected_type in self.type_priority):
                    self._extract_pattern(col_name, 'primary')
                
                # Discover foreign key patterns
                elif (0.3 < col.unique_ratio < 0.95  # Partial uniqueness
                    and col.null_percent < 0.2):
                    self._extract_pattern(col_name, 'foreign')
            
            if not self.key_patterns['primary']:
                self.key_patterns['primary'].update(['id', 'pk', 'key', 'uid', 'code'])
            
            if not self.key_patterns['foreign']:
                self.key_patterns['foreign'].update(['_id', '_fk', '_ref', '_code'])           

    def _extract_pattern(self, col_name: str, key_type: str):
        """Extract common key suffixes/prefixes"""
        # Add full column name as potential pattern
        self.key_patterns[key_type].add(col_name.lower())
        
        # Add common variants
        if '_' in col_name:
            base, suffix = col_name.rsplit('_', 1)
            self.key_patterns[key_type].add(suffix.lower())
            self.key_patterns[key_type].add(f"_{suffix.lower()}")
