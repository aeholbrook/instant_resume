'use client';

import dynamic from 'next/dynamic';
import { useEditor } from '@/lib/editor-context';
import { useCallback, useEffect } from 'react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function MonacoYamlEditor() {
  const { state, dispatch, save } = useEditor();

  const language = state.currentFile.endsWith('.yaml') || state.currentFile.endsWith('.yml')
    ? 'yaml'
    : state.currentFile.endsWith('.tex') || state.currentFile.endsWith('.sty')
    ? 'latex'
    : state.currentFile.endsWith('.json')
    ? 'json'
    : state.currentFile.endsWith('.md')
    ? 'markdown'
    : 'plaintext';

  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      dispatch({ type: 'SET_CONTENT', content: value });
    }
  }, [dispatch]);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  return (
    <div className="editor-monaco">
      <div className="editor-file-label">
        {state.currentFile}
      </div>
      <Editor
        height="100%"
        language={language}
        theme={state.darkMode ? 'vs-dark' : 'vs-light'}
        value={state.content}
        onChange={handleChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          scrollBeyondLastLine: false,
          tabSize: 2,
          automaticLayout: true,
        }}
      />
    </div>
  );
}
