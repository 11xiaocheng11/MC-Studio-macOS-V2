import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import useProjectStore from '../../store/projectStore';
import useEditorStore from '../../store/editorStore';
import { getPythonCompletions } from './PythonConfig';

function FileTree({ dirPath, onFileSelect, level = 0 }) {
  const [entries, setEntries] = useState([]);
  const [expanded, setExpanded] = useState(level < 2);

  useEffect(() => {
    const load = async () => {
      if (!dirPath || !window.electronAPI) return;
      const result = await window.electronAPI.fs.readDir(dirPath);
      if (!result.error) {
        const sorted = result.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        setEntries(sorted);
      }
    };
    if (expanded) load();
  }, [dirPath, expanded]);

  const getFileIcon = (name) => {
    if (name.endsWith('.py')) return '🐍';
    if (name.endsWith('.json')) return '📋';
    if (name.endsWith('.png') || name.endsWith('.jpg')) return '🖼';
    if (name.endsWith('.md')) return '📝';
    return '📄';
  };

  return (
    <div style={{ paddingLeft: level * 16 }}>
      {entries.map(entry => (
        <div key={entry.path}>
          <div
            className={`file-tree__item ${entry.isDirectory ? 'file-tree__item--dir' : ''}`}
            onClick={() => {
              if (entry.isDirectory) {
                setExpanded(!expanded);
              } else {
                onFileSelect(entry.path);
              }
            }}
          >
            <span style={{ fontSize: 12 }}>
              {entry.isDirectory ? (expanded ? '📂' : '📁') : getFileIcon(entry.name)}
            </span>
            <span>{entry.name}</span>
          </div>
          {entry.isDirectory && expanded && (
            <FileTree dirPath={entry.path} onFileSelect={onFileSelect} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CodeEditorView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const { openFiles, activeFile, fileContents, openFile, closeFile, setActiveFile, updateFileContent, saveFile } = useEditorStore();

  const handleEditorMount = (editor, monaco) => {
    // Register Python 2.7 + Mod SDK completions
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };
        return { suggestions: getPythonCompletions(monaco, range) };
      },
    });

    // Dark theme matching our design system
    monaco.editor.defineTheme('mc-studio-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '5f6368', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7b2ff7' },
        { token: 'string', foreground: '00e676' },
        { token: 'number', foreground: 'ff9100' },
        { token: 'function', foreground: '00d2ff' },
        { token: 'variable', foreground: 'e8eaed' },
        { token: 'type', foreground: '00d2ff' },
      ],
      colors: {
        'editor.background': '#0d0d1a',
        'editor.foreground': '#e8eaed',
        'editor.lineHighlightBackground': '#1a1a2e',
        'editor.selectionBackground': '#243b6e',
        'editorCursor.foreground': '#00d2ff',
        'editorLineNumber.foreground': '#5f6368',
        'editorLineNumber.activeForeground': '#00d2ff',
        'editor.selectionHighlightBackground': '#243b6e50',
        'editorIndentGuide.background': '#1a1a2e',
        'editorIndentGuide.activeBackground': '#243b6e',
      },
    });
    monaco.editor.setTheme('mc-studio-dark');
  };

  const handleSave = useCallback(async () => {
    if (!activeFile) return;
    const success = await saveFile(activeFile);
    if (success) {
      addToast('success', '文件已保存');
    }
  }, [activeFile, saveFile, addToast]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  if (!currentProject) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon" style={{ fontSize: 64 }}>📝</div>
        <div className="empty-state__title">NO PROJECT OPEN</div>
        <div className="empty-state__desc">请先在项目管理中打开一个项目</div>
      </div>
    );
  }

  const getFileName = (filePath) => filePath.split('/').pop();
  const getLanguage = (filePath) => {
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.js')) return 'javascript';
    if (filePath.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  return (
    <div className="split-pane" style={{ height: '100%' }}>
      {/* File Tree */}
      <div className="split-pane__left">
        <div style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 4 }}>
            FILE EXPLORER
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{currentProject.name}</div>
        </div>
        <div className="file-tree" style={{ overflow: 'auto', flex: 1 }}>
          <FileTree dirPath={currentProject.path} onFileSelect={openFile} />
        </div>
      </div>

      {/* Editor Area */}
      <div className="split-pane__right" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        {openFiles.length > 0 && (
          <div className="tabs" style={{ flexShrink: 0 }}>
            {openFiles.map(filePath => (
              <div
                key={filePath}
                className={`tab ${activeFile === filePath ? 'tab--active' : ''}`}
                onClick={() => setActiveFile(filePath)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>{getFileName(filePath)}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); closeFile(filePath); }}
                  style={{ opacity: 0.5, cursor: 'pointer', fontSize: 11, lineHeight: 1 }}
                >
                  ✕
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Monaco Editor */}
        <div style={{ flex: 1 }}>
          {activeFile ? (
            <Editor
              height="100%"
              language={getLanguage(activeFile)}
              value={fileContents[activeFile] || ''}
              onChange={(value) => updateFileContent(activeFile, value || '')}
              onMount={handleEditorMount}
              theme="mc-studio-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: true, side: 'right' },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                padding: { top: 12 },
                tabSize: 4,
              }}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ fontSize: 48 }}>📝</div>
              <div className="empty-state__title">SELECT A FILE</div>
              <div className="empty-state__desc">从左侧文件树中选择一个文件开始编辑</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
