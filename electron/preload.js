const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File System
  fs: {
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),
    exists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
    remove: (targetPath) => ipcRenderer.invoke('fs:remove', targetPath),
    copy: (src, dest) => ipcRenderer.invoke('fs:copy', src, dest),
  },

  shell: {
    openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
    showItemInFolder: (p) => ipcRenderer.invoke('shell:showItemInFolder', p),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },

  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  },

  project: {
    importZip: (zipPath, projectsDir) => ipcRenderer.invoke('project:importZip', zipPath, projectsDir),
  },

  package: {
    create: (projectPath, outputPath) => ipcRenderer.invoke('package:create', projectPath, outputPath),
    create7z: (projectPath, outputPath) => ipcRenderer.invoke('package:create7z', projectPath, outputPath),
  },

  server: {
    start: (filePath, port) => ipcRenderer.invoke('server:start', filePath, port),
    stop: () => ipcRenderer.invoke('server:stop'),
  },

  // === Wine / GPTK Integration ===
  wine: {
    detect: () => ipcRenderer.invoke('wine:detect'),
    getPrefix: () => ipcRenderer.invoke('wine:getPrefix'),
    initPrefix: (wineBinary, prefix) => ipcRenderer.invoke('wine:initPrefix', wineBinary, prefix),
    launch: (wineBinary, exePath, prefix, args) => ipcRenderer.invoke('wine:launch', wineBinary, exePath, prefix, args),
    launchGame: (wineBinary, exePath, prefix, projectPath) => ipcRenderer.invoke('wine:launchGame', wineBinary, exePath, prefix, projectPath),
    syncProject: (projectPath) => ipcRenderer.invoke('wine:syncProject', projectPath),
    kill: () => ipcRenderer.invoke('wine:kill'),
    isRunning: () => ipcRenderer.invoke('wine:isRunning'),
    onLog: (callback) => ipcRenderer.on('wine:log', (_, data) => callback(data)),
    onExit: (callback) => ipcRenderer.on('wine:exit', (_, data) => callback(data)),
    removeListeners: () => {
      ipcRenderer.removeAllListeners('wine:log');
      ipcRenderer.removeAllListeners('wine:exit');
    },
  },

  devkit: {
    scan: (searchPath) => ipcRenderer.invoke('devkit:scan', searchPath),
  },

  // === Mod Download & Install ===
  mod: {
    download: (url, destPath) => ipcRenderer.invoke('mod:download', url, destPath),
    install: (filePath) => ipcRenderer.invoke('mod:install', filePath),
    list: () => ipcRenderer.invoke('mod:list'),
    uninstall: (modPath) => ipcRenderer.invoke('mod:uninstall', modPath),
    findMCData: () => ipcRenderer.invoke('wine:findMCData'),
    onDownloadProgress: (callback) => ipcRenderer.on('mod:downloadProgress', (_, data) => callback(data)),
    removeDownloadListeners: () => ipcRenderer.removeAllListeners('mod:downloadProgress'),
  },
});
