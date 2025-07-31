# backend/services/fuzzy_matching.py
import string
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Dict, List, Tuple, Optional
import pandas as pd
from rapidfuzz import process, fuzz, utils as fuzz_utils
from unidecode import unidecode
import logging
from backend.models.schema_models import TableProfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Translation table for removing punctuation
TRANSLATION_TABLE = str.maketrans('', '', string.punctuation + ' ')

class LRUCache:
    """Least Recently Used cache for storing processed column data"""
    def __init__(self, maxsize: int = 10000):
        self.maxsize = maxsize
        self._cache = OrderedDict()

    def get(self, key: Tuple[str, str]) -> Optional[pd.Series]:
        try:
            # Move to end to mark as recently used
            value = self._cache.pop(key)
            self._cache[key] = value
            return value
        except KeyError:
            return None

    def set(self, key: Tuple[str, str], value: pd.Series) -> None:
        if key in self._cache:
            # Update existing key
            self._cache.pop(key)
        elif len(self._cache) >= self.maxsize:
            # Remove least recently used
            self._cache.popitem(last=False)
        self._cache[key] = value

class FuzzyEntityMatcher:
    """Production-grade fuzzy entity matching system"""
    def __init__(self, config: Dict = None):
        self.config = {
            'scorer': fuzz.WRatio,  # Weighted Ratio scorer
            'score_cutoff': 90,      # Minimum similarity score (0-100)
            'chunk_size': 1000,      # Rows per processing chunk
            'max_workers': 4,        # Thread pool size
            'cache_size': 10000,     # Max cached columns
            **(config or {})
        }
        
        # Initialize components
        self.executor = ThreadPoolExecutor(
            max_workers=self.config['max_workers']
        )
        self.cache = LRUCache(maxsize=self.config['cache_size'])
        self.seen_pairs = set()

    def find_matches_across_tables(self, 
                                schema: Dict[str, TableProfile],
                                data_samples: Dict[str, Dict[str, pd.Series]]) -> List[Dict]:
        """
        Main entry point: Find matches across all tables and columns
        Args:
            schema: Dictionary of {table: {column: metadata}}
            data_samples: Dictionary of {table: {column: pd.Series}}
        Returns:
            List of match dictionaries with scoring metadata
        """
        matches = []
        table_pairs = self._generate_table_pairs(list(schema.keys()))
        
        for source_table, target_table in table_pairs:
            source_profile = schema[source_table]
            target_profile = schema[target_table]

            source_cols = self._get_match_candidates(source_profile)
            target_cols = self._get_match_candidates(target_profile)
            
            for src_col in source_cols:
                for tgt_col in target_cols:
                    if self._should_skip_match(source_table, src_col, target_table, tgt_col):
                        continue
                    
                    column_matches = self._match_columns(
                        source_table, src_col, data_samples[source_table][src_col],
                        target_table, tgt_col, data_samples[target_table][tgt_col]
                    )
                    matches.extend(column_matches)
        
        return self._filter_matches(matches)

    def _match_columns(self,
                    src_table: str,
                    src_col: str,
                    src_data: pd.Series,
                    tgt_table: str,
                    tgt_col: str,
                    tgt_data: pd.Series) -> List[Dict]:
        """Optimized column matching with sampling and speed improvements"""
        try:
            # Sample large columns for faster processing
            if len(src_data) > 500:
                src_data = src_data.sample(n=500, random_state=42)
            if len(tgt_data) > 1000:
                return []

            # Preprocess and normalize values
            src_processed = self._preprocess_column(src_data, (src_table, src_col))
            tgt_processed = self._preprocess_column(tgt_data, (tgt_table, tgt_col))

            # Build target lookup index
            tgt_index = self._create_lookup_index(tgt_processed)

            matches = []
            for idx, value in src_processed.items():
                if not value:
                    continue

                # Fast exact match
                if value in tgt_index:
                    matches.append({
                        'source_idx': idx,
                        'target_idx': tgt_index[value],
                        'score': 1.0,
                        'type': 'exact'
                    })
                    continue

                # Fast fuzzy match (sampled + faster scorer)
                result = process.extractOne(
                    query=value,
                    choices=tgt_index.keys(),
                    scorer=fuzz.partial_ratio,  # ⏩ faster than WRatio
                    score_cutoff=self.config.get('score_cutoff', 75)
                )

                if result:
                    matched_value, score, _ = result
                    matches.append({
                        'source_idx': idx,
                        'target_idx': tgt_index[matched_value],
                        'score': score / 100,
                        'type': 'fuzzy'
                    })

            return matches

        except Exception as e:
            logger.error(f"Fuzzy match failed: {src_table}.{src_col} <-> {tgt_table}.{tgt_col}:{e}")
            return []

    def _preprocess_column(self, 
                          data: pd.Series,
                          cache_key: Tuple[str, str]) -> pd.Series:
        """Normalize and cache column data"""
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached
            
        processed = data.apply(self._normalize_value).dropna()
        self.cache.set(cache_key, processed)
        return processed

    def _normalize_value(self, value) -> Optional[str]:
        """Text normalization pipeline"""
        try:
            if pd.isna(value):
                return None
                
            # Unicode normalization and case folding
            text = unidecode(str(value)).casefold()
            
            # Remove punctuation and whitespace
            text = text.translate(TRANSLATION_TABLE)
            
            # RapidFuzz default processing
            return fuzz_utils.default_process(text) or None
        except Exception as e:
            logger.warning(f"Normalization error for value '{value}':{str(e)}")
            return None

    def _create_lookup_index(self, processed_series: pd.Series) -> Dict[str, int]:
        """Create reverse index of normalized values to original indices"""
        return {
            value: idx 
            for idx, value in processed_series.items()
            if value is not None
        }

    def _chunk_generator(self, series: pd.Series):
        """Generate chunks of data for memory efficiency"""
        for i in range(0, len(series), self.config['chunk_size']):
            yield series.iloc[i:i + self.config['chunk_size']]

    def _process_chunk(self, chunk: pd.Series, tgt_index: Dict[str, int]):
        """Process a chunk of data using thread pool"""
        futures = [
            self.executor.submit(
                self._find_match,
                (idx, value),
                tgt_index
            )
            for idx, value in chunk.items()
        ]
        return [f.result() for f in futures if f.result() is not None]

    def _find_match(self, 
                   source_item: Tuple[int, str],
                   tgt_index: Dict[str, int]) -> Optional[Dict]:
        """Find best match for a single value"""
        idx, value = source_item
        if not value:
            return None
        
        # First check exact match
        if value in tgt_index:
            return {
                'source_idx': idx,
                'target_idx': tgt_index[value],
                'score': 1.0,
                'type': 'exact'
            }
        
        # Then fuzzy match
        result = process.extractOne(
            query=value,
            choices=tgt_index.keys(),
            scorer=self.config['scorer'],
            score_cutoff=self.config['score_cutoff']
        )
        
        if result:
            matched_value, score, _ = result
            return {
                'source_idx': idx,
                'target_idx': tgt_index[matched_value],
                'score': score / 100,
                'type': 'fuzzy'
            }
        return None

    def _generate_table_pairs(self, tables):
        """Generate all unique table pairs from a list of table names"""
        return [
            (t1, t2) 
            for i, t1 in enumerate(tables)
            for t2 in tables[i+1:]
        ]

    def _get_match_candidates(self, table_profile: TableProfile) -> List[str]:
        """Identify matchable columns from TableProfile"""
        matchable = []
        for col_name, col_meta in table_profile.columns.items():
            detected_base_type = col_meta.detected_type.split('(')[0].upper()

            if detected_base_type in ['VARCHAR', 'TEXT', 'CHAR'] and col_meta.unique_ratio < 0.8:
                matchable.append(col_name)

        return matchable

    def _should_skip_match(self, 
                          src_table: str,
                          src_col: str,
                          tgt_table: str,
                          tgt_col: str) -> bool:
        """Avoid redundant comparisons"""
        pair_key = frozenset([
            f"{src_table}.{src_col}",
            f"{tgt_table}.{tgt_col}"
        ])
        if pair_key in self.seen_pairs:
            return True
        self.seen_pairs.add(pair_key)
        return False

    def _filter_matches(self, matches: List[Dict]) -> List[Dict]:
        """Filter and deduplicate matches safely"""
        required_keys = {'source_value', 'target_value', 'source_table', 'target_table'}
        seen = set()
        filtered = []

        for match in sorted(matches, key=lambda x: -x.get('similarity', 0)):
            if not required_keys.issubset(match):
                # Optional: log or skip silently
                continue

            match_key = (
                match['source_value'],
                match['target_value'],
                match['source_table'],
                match['target_table']
            )

            if match_key not in seen:
                seen.add(match_key)
                filtered.append(match)

        return filtered
    
