'use client';

import { EditorProvider, useEditor } from '@/lib/editor-context';
import MonacoYamlEditor from '@/components/editor/MonacoYamlEditor';
import StructuredEditor from '@/components/editor/structured/StructuredEditor';
import PreviewPanel from '@/components/editor/PreviewPanel';
import EditorToolbar from '@/components/editor/EditorToolbar';
import FileTree from '@/components/editor/FileTree';
import './editor.css';

function EditorLayout() {
  const { state, dispatch } = useEditor();

  return (
    <div className={`editor-root ${state.darkMode ? 'dark' : 'light'}`}>
      <EditorToolbar />
      <div className="editor-body">
        {state.editorMode === 'yaml' && state.sidebarOpen && <FileTree />}
        {state.editorMode === 'yaml' ? <MonacoYamlEditor /> : <StructuredEditor />}
        <PreviewPanel />
      </div>
      {state.compileLog && (
        <div className="compile-log">
          <div className="compile-log-header">
            <span>Compile Log</span>
            <button onClick={() => dispatch({ type: 'COMPILE_DONE', success: true, log: '' })}>
              \u2715
            </button>
          </div>
          <pre className="compile-log-content">{state.compileLog}</pre>
        </div>
      )}
    </div>
  );
}

export default function EditorClient() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
