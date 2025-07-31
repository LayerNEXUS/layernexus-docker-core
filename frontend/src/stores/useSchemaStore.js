import { create } from 'zustand';
import { API_BASE_URL } from "../config";
import { fetchWithAuth } from "../utils/fetchWithAuth";

// Helper functions (stubbed for now)
function detectConflicts(schemas) { /* implement conflict detection */ }
function applyOverrides(schemas, overrides) { /* implement override logic */ }

const useSchemaStore = create((set, get) => ({
  // Core state
  schemas: [],
  conflicts: [],
  userOverrides: {},

  // Upload & result handling
  uploadedFiles: [],
  uploadResult: {},

  // View controls
  dialect: 'postgres',
  view: 'original',
  mermaidText: '',

  // ──────── Actions ────────

  setRawSchemas: (schemas) => {
    const conflicts = detectConflicts(schemas);
    set({ schemas, conflicts });
  },

  resolveConflict: (conflictId, resolution) => {
    set((state) => ({
      userOverrides: {
        ...state.userOverrides,
        [conflictId]: resolution,
      },
      conflicts: state.conflicts.filter((c) => c.id !== conflictId),
    }));
  },

  getNormalizedSchema: () => {
    return applyOverrides(get().schemas, get().userOverrides);
  },

  setUploadedFiles: (files) => {
    const safeNames = files.map((f) => (typeof f === 'string' ? f : f.name));
    set({ uploadedFiles: safeNames });
  },

  setUploadResult: (result) => {
    const filenames = result.filenames || [];
    set((state) => ({
      uploadResult: {
        ...state.uploadResult,
        ...result,
      },
      uploadedFiles: filenames.length > 0 ? filenames : state.uploadedFiles,
    }));
  },


  // View/dialect/mermaid controls
  setView: (view) => set({ view }),
  setDialect: (dialect) => set({ dialect }),
  setMermaidText: (val) => set({ mermaidText: val }),
  aiSQL: "",
  setAiSQL: (val) => set({ aiSQL: val }),

  resetSchemaState: () =>
  set({
    uploadResult: {},
    uploadedFiles: [],
    aiSQL: "",
    mermaidText: "",
    view: "original",
  }),

  files: [],
  setFiles: (files) => set({ files }),
  refreshFiles: async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/user/files`);
      set({ files: res.files || [] });
    } catch (err) {
      console.error("❌ Failed to refresh files:", err);
      set({ files: [] });
    }
  },
    
    // AI-generated schema metadata (for post-cleanup editing)
    lastSavedSchemaId: null,
    existingSchema: {
      session_id: null,
      name: "",
      tags: [],
      is_ai_version: false,
    },

    setLastSchemaMeta: (meta) => {
    set({
      lastSavedSchemaId: meta.session_id,
      existingSchema: {
        session_id: meta.session_id,
        name: meta.name || "",
        tags: meta.tags || [],
        is_ai_version: !!meta.is_ai_version,
      },
    });
  },

  updateSchemaMeta: (updates) => {
    set((state) => ({
      existingSchema: {
        ...state.existingSchema,
        ...updates,
      },
    }));
  },
  

}));



export default useSchemaStore;
