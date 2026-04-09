import { create } from 'zustand';

const useEditorStore = create((set, get) => ({
  openFiles: [],
  activeFile: null,
  fileContents: {},

  openFile: async (filePath) => {
    const { openFiles } = get();
    
    // Already open? Just activate
    if (openFiles.includes(filePath)) {
      set({ activeFile: filePath });
      return;
    }

    // Read file content
    if (window.electronAPI) {
      const result = await window.electronAPI.fs.readFile(filePath);
      if (result.content !== undefined) {
        set(state => ({
          openFiles: [...state.openFiles, filePath],
          activeFile: filePath,
          fileContents: { ...state.fileContents, [filePath]: result.content },
        }));
      }
    }
  },

  closeFile: (filePath) => {
    set(state => {
      const newFiles = state.openFiles.filter(f => f !== filePath);
      const newContents = { ...state.fileContents };
      delete newContents[filePath];
      
      let newActive = state.activeFile;
      if (state.activeFile === filePath) {
        const idx = state.openFiles.indexOf(filePath);
        newActive = newFiles[Math.min(idx, newFiles.length - 1)] || null;
      }

      return {
        openFiles: newFiles,
        activeFile: newActive,
        fileContents: newContents,
      };
    });
  },

  setActiveFile: (filePath) => set({ activeFile: filePath }),

  updateFileContent: (filePath, content) => {
    set(state => ({
      fileContents: { ...state.fileContents, [filePath]: content },
    }));
  },

  saveFile: async (filePath) => {
    const content = get().fileContents[filePath];
    if (content !== undefined && window.electronAPI) {
      await window.electronAPI.fs.writeFile(filePath, content);
      return true;
    }
    return false;
  },

  saveAllFiles: async () => {
    const { openFiles, fileContents } = get();
    for (const filePath of openFiles) {
      if (fileContents[filePath] !== undefined && window.electronAPI) {
        await window.electronAPI.fs.writeFile(filePath, fileContents[filePath]);
      }
    }
  },
}));

export default useEditorStore;
