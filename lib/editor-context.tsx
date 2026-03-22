'use client';

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ResumeData } from './resume';
import { downloadPdf } from './generate-pdf';
import type { ProfileInfo } from './profile-filter';
import { filterContent, getAvailableProfiles } from './profile-filter';
import yaml from 'yaml';

type FileInfo = { name: string; mtime: number; size: number };

type EditorState = {
  project: string;
  files: FileInfo[];
  currentFile: string;
  content: string;
  savedContent: string;
  parsedData: ResumeData | null;
  rawData: ResumeData | null;
  parseError: string | null;
  selectedProfile: string | undefined;
  profiles: ProfileInfo[];
  editorMode: 'yaml' | 'cards';
  compiling: boolean;
  compilingAll: boolean;
  compileLog: string;
  darkMode: boolean;
  sidebarOpen: boolean;
};

type EditorAction =
  | { type: 'SET_CONTENT'; content: string }
  | { type: 'SET_PARSED'; data: ResumeData | null; rawData: ResumeData | null; error: string | null; profiles: ProfileInfo[] }
  | { type: 'SET_FILE'; file: string; content: string }
  | { type: 'SET_FILES'; files: FileInfo[] }
  | { type: 'SET_PROFILE'; profile: string | undefined }
  | { type: 'SET_EDITOR_MODE'; mode: 'yaml' | 'cards' }
  | { type: 'SAVE_DONE'; content: string }
  | { type: 'COMPILE_START'; all?: boolean }
  | { type: 'COMPILE_DONE'; success: boolean; log: string }
  | { type: 'TOGGLE_DARK' }
  | { type: 'TOGGLE_SIDEBAR' };

const initialState: EditorState = {
  project: 'default',
  files: [],
  currentFile: 'content.yaml',
  content: '',
  savedContent: '',
  parsedData: null,
  rawData: null,
  parseError: null,
  selectedProfile: undefined,
  profiles: [],
  editorMode: 'yaml',
  compiling: false,
  compilingAll: false,
  compileLog: '',
  darkMode: false,
  sidebarOpen: true,
};

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CONTENT':
      return { ...state, content: action.content };
    case 'SET_PARSED':
      return { ...state, parsedData: action.data, rawData: action.rawData, parseError: action.error, profiles: action.profiles };
    case 'SET_EDITOR_MODE':
      return { ...state, editorMode: action.mode };
    case 'SET_FILE':
      return { ...state, currentFile: action.file, content: action.content, savedContent: action.content };
    case 'SET_FILES':
      return { ...state, files: action.files };
    case 'SET_PROFILE':
      return { ...state, selectedProfile: action.profile };
    case 'SAVE_DONE':
      return { ...state, savedContent: action.content };
    case 'COMPILE_START':
      return { ...state, compiling: true, compilingAll: !!action.all, compileLog: '' };
    case 'COMPILE_DONE':
      return { ...state, compiling: false, compilingAll: false, compileLog: action.log };
    case 'TOGGLE_DARK': {
      const next = !state.darkMode;
      try { localStorage.setItem('editor-dark-mode', JSON.stringify(next)); } catch {}
      return { ...state, darkMode: next };
    }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    default:
      return state;
  }
}

type EditorContextValue = {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  save: () => Promise<void>;
  compile: (profile?: string) => Promise<void>;
  compileAll: () => Promise<void>;
  loadFile: (filename: string) => Promise<void>;
  updateRawData: (newRaw: ResumeData) => void;
  isDirty: boolean;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const parseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Restore persisted dark mode on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('editor-dark-mode');
      if (stored === 'true') dispatch({ type: 'TOGGLE_DARK' });
    } catch {}
  }, []);

  const isDirty = state.content !== state.savedContent;

  const updateRawData = useCallback((newRaw: ResumeData) => {
    const newYaml = yaml.stringify(newRaw, { lineWidth: 0 });
    dispatch({ type: 'SET_CONTENT', content: newYaml });
  }, []);

  // Parse YAML and update preview (debounced)
  useEffect(() => {
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current);

    // Only parse if current file is YAML
    if (!state.currentFile.endsWith('.yaml') && !state.currentFile.endsWith('.yml')) {
      return;
    }

    parseTimerRef.current = setTimeout(() => {
      try {
        const raw = yaml.parse(state.content) as ResumeData;
        if (!raw || typeof raw !== 'object') {
          dispatch({ type: 'SET_PARSED', data: null, rawData: null, error: 'Invalid YAML structure', profiles: [] });
          return;
        }
        const profiles = getAvailableProfiles(raw);
        const filtered = filterContent(raw, state.selectedProfile);
        dispatch({ type: 'SET_PARSED', data: filtered, rawData: raw, error: null, profiles });
      } catch (err) {
        dispatch({ type: 'SET_PARSED', data: null, rawData: state.rawData, error: String(err), profiles: state.profiles });
      }
    }, 300);

    return () => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
    };
  }, [state.content, state.selectedProfile, state.currentFile]);

  // Re-filter when profile changes (using already-parsed content)
  // This is handled by the above effect since selectedProfile is a dependency

  const loadFile = useCallback(async (filename: string) => {
    const res = await fetch('/api/editor/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: state.project, filename }),
    });
    const data = await res.json();
    if (data.content !== undefined) {
      dispatch({ type: 'SET_FILE', file: filename, content: data.content });
    }
  }, [state.project]);

  const save = useCallback(async () => {
    const res = await fetch('/api/editor/save', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: state.project,
        filename: state.currentFile,
        content: state.content,
      }),
    });
    const data = await res.json();
    if (data.success) {
      dispatch({ type: 'SAVE_DONE', content: state.content });
    }
  }, [state.project, state.currentFile, state.content]);

  const compile = useCallback(async (profile?: string) => {
    dispatch({ type: 'COMPILE_START' });
    try {
      // Save first if dirty
      if (state.content !== state.savedContent) {
        await fetch('/api/editor/save', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: state.project,
            filename: state.currentFile,
            content: state.content,
          }),
        });
        dispatch({ type: 'SAVE_DONE', content: state.content });
      }

      const p = profile || state.selectedProfile;
      const filename = p ? `resume-${p}.pdf` : 'resume.pdf';
      await downloadPdf(p, filename);

      dispatch({ type: 'COMPILE_DONE', success: true, log: `Downloaded ${filename}` });
    } catch (err) {
      dispatch({ type: 'COMPILE_DONE', success: false, log: String(err) });
    }
  }, [state.project, state.currentFile, state.content, state.savedContent, state.selectedProfile]);

  const compileAll = useCallback(async () => {
    dispatch({ type: 'COMPILE_START', all: true });
    try {
      // Save first
      if (state.content !== state.savedContent) {
        await fetch('/api/editor/save', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: state.project,
            filename: state.currentFile,
            content: state.content,
          }),
        });
        dispatch({ type: 'SAVE_DONE', content: state.content });
      }

      // Download PDF for each profile
      const allProfiles = [
        { label: 'default', profile: undefined as string | undefined },
        ...state.profiles.map(p => ({ label: p.name, profile: p.name })),
      ];

      const results: string[] = [];
      for (const { label, profile } of allProfiles) {
        const filename = profile ? `resume-${profile}.pdf` : 'resume.pdf';
        try {
          await downloadPdf(profile, filename);
          results.push(`${label}: downloaded ${filename}`);
        } catch (err) {
          results.push(`${label}: failed — ${err}`);
        }
      }

      dispatch({ type: 'COMPILE_DONE', success: true, log: results.join('\n') });
    } catch (err) {
      dispatch({ type: 'COMPILE_DONE', success: false, log: String(err) });
    }
  }, [state.project, state.currentFile, state.content, state.savedContent, state.profiles]);

  // Load file list on mount
  useEffect(() => {
    fetch(`/api/editor/files?project=${state.project}`)
      .then(r => r.json())
      .then(data => {
        if (data.files) dispatch({ type: 'SET_FILES', files: data.files });
      });
  }, [state.project]);

  // Load content.yaml on mount
  useEffect(() => {
    loadFile('content.yaml');
  }, [loadFile]);

  return (
    <EditorContext.Provider value={{ state, dispatch, save, compile, compileAll, loadFile, updateRawData, isDirty }}>
      {children}
    </EditorContext.Provider>
  );
}
