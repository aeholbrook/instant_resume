'use client';

import { useEditor } from '@/lib/editor-context';

const FILE_ICONS: Record<string, string> = {
  '.yaml': '\uD83D\uDCCB',
  '.yml': '\uD83D\uDCCB',
  '.tex': '\uD83D\uDCC4',
  '.sty': '\uD83C\uDFA8',
  '.md': '\uD83D\uDCDD',
  '.json': '\u2699',
};

function getIcon(filename: string): string {
  for (const [ext, icon] of Object.entries(FILE_ICONS)) {
    if (filename.endsWith(ext)) return icon;
  }
  return '\uD83D\uDCC4';
}

export default function FileTree() {
  const { state, loadFile } = useEditor();

  if (!state.sidebarOpen) return null;

  return (
    <div className="file-tree">
      <div className="file-tree-header">Files</div>
      <ul className="file-list">
        {state.files.map(file => (
          <li
            key={file.name}
            className={`file-item ${state.currentFile === file.name ? 'active' : ''}`}
            onClick={() => loadFile(file.name)}
          >
            <span className="file-icon">{getIcon(file.name)}</span>
            <span className="file-name">{file.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
