const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const isDev = !app.isPackaged;
const ARCH = process.arch; // 'arm64' on Apple Silicon
let mainWindow;

// ==========================================
// === GLOBAL ERROR HANDLERS (防崩溃) ===
// ==========================================
process.on('uncaughtException', (error) => {
  console.error('[MC-Studio] Uncaught Exception:', error.message);
  console.error(error.stack);
  // 不退出进程，让应用继续运行
});

process.on('unhandledRejection', (reason) => {
  console.error('[MC-Studio] Unhandled Rejection:', reason);
});

// ==========================================
// === Window Management ===
// ==========================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#0f0f23',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5174').catch(err => {
      console.error('[MC-Studio] Failed to load dev URL:', err.message);
      // 如果 Vite 未启动，等 2 秒重试
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:5174').catch(() => {
          mainWindow.loadFile(path.join(__dirname, '../fallback.html'));
        });
      }, 2000);
    });
    // DevTools 在独立窗口打开，不影响主窗口
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 渲染进程崩溃时自动恢复
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[MC-Studio] Renderer crashed:', details.reason);
    if (details.reason !== 'clean-exit') {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.reload();
        }
      }, 1000);
    }
  });

  mainWindow.on('unresponsive', () => {
    console.warn('[MC-Studio] Window unresponsive, reloading...');
    mainWindow.reload();
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ==========================================
// === Helper: 安全执行命令 ===
// ==========================================
function safeExec(cmd, timeout = 5000) {
  try {
    return { output: execSync(cmd, { timeout, stdio: ['pipe', 'pipe', 'pipe'] }).toString().trim(), error: null };
  } catch (err) {
    const errMsg = err.stderr ? err.stderr.toString() : err.message;
    return { output: null, error: errMsg };
  }
}

// 检查二进制文件的 CPU 架构
function checkBinaryArch(binaryPath) {
  try {
    const result = execSync(`file "${binaryPath}"`, { timeout: 3000 }).toString();
    if (result.includes('arm64') || result.includes('aarch64')) return 'arm64';
    if (result.includes('x86_64')) return 'x86_64';
    if (result.includes('i386')) return 'i386';
    if (result.includes('universal')) return 'universal';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// 检查 Rosetta 2 是否安装
function isRosettaInstalled() {
  try {
    execSync('/usr/bin/pgrep -q oahd', { timeout: 2000 });
    return true;
  } catch {
    // 另一种检测方式
    try {
      const result = execSync('arch -x86_64 /usr/bin/true 2>&1', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }
}

// === File System IPC (same as iOS version) ===
ipcMain.handle('fs:readDir', async (_, dirPath) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map(e => ({ name: e.name, isDirectory: e.isDirectory(), path: path.join(dirPath, e.name) }));
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try { return { content: await fs.promises.readFile(filePath, 'utf-8') }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('fs:writeFile', async (_, filePath, content) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('fs:mkdir', async (_, dirPath) => {
  try { await fs.promises.mkdir(dirPath, { recursive: true }); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('fs:exists', async (_, p) => {
  try { await fs.promises.access(p); return true; } catch { return false; }
});

ipcMain.handle('fs:remove', async (_, p) => {
  try { await fs.promises.rm(p, { recursive: true, force: true }); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('fs:copy', async (_, src, dest) => {
  try { await fs.promises.cp(src, dest, { recursive: true }); return { success: true }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('shell:openPath', async (_, p) => { await shell.openPath(p); });
ipcMain.handle('shell:showItemInFolder', async (_, p) => { shell.showItemInFolder(p); });
ipcMain.handle('shell:openExternal', async (_, url) => { await shell.openExternal(url); });
ipcMain.handle('app:getPath', async (_, name) => app.getPath(name));

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('dialog:openFile', async (_, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [
      { name: 'Mod Files', extensions: ['zip', 'mcaddon', 'mcpack'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

// === Project Import ===
ipcMain.handle('project:importZip', async (_, zipPath, projectsDir) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const baseName = path.basename(zipPath, path.extname(zipPath));
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const projectPath = path.join(projectsDir, safeName);

    // Create project directory
    await fs.promises.mkdir(projectPath, { recursive: true });

    // Extract zip
    try {
      require('child_process').execSync(`unzip -o "${zipPath}" -d "${projectPath}"`, { timeout: 60000 });
    } catch (err) {
      return { error: `解压失败: ${err.message}` };
    }

    // Auto-detect project name from manifests
    let projectName = baseName;
    const manifestPaths = [
      path.join(projectPath, 'behavior_pack/pack_manifest.json'),
      path.join(projectPath, 'behavior_pack/manifest.json'),
    ];
    for (const mp of manifestPaths) {
      try {
        const content = await fs.promises.readFile(mp, 'utf-8');
        const manifest = JSON.parse(content);
        if (manifest.header?.name) {
          projectName = manifest.header.name.replace(/ (BP|netease_suffix)/g, '').trim();
          break;
        }
      } catch {}
    }

    // Create project.json config
    const config = {
      id: uuidv4(),
      name: projectName,
      type: 'addon',
      template: 'imported',
      importedFrom: zipPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    await fs.promises.writeFile(
      path.join(projectPath, 'project.json'),
      JSON.stringify(config, null, 2)
    );

    return { success: true, config: { ...config, path: projectPath } };
  } catch (err) {
    return { error: err.message };
  }
});

// === Packaging IPC ===
ipcMain.handle('package:create', async (_, projectPath, outputPath) => {
  try {
    const archiver = require('archiver');
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    return new Promise((resolve, reject) => {
      output.on('close', () => resolve({ success: true, size: archive.pointer() }));
      archive.on('error', err => reject({ error: err.message }));
      archive.pipe(output);
      archive.glob('**/*', {
        cwd: projectPath,
        ignore: ['.*', '__MACOSX/**', '__pycache__/**', '**/*.pyc', '**/.DS_Store', '**/._*'],
      });
      archive.finalize();
    });
  } catch (err) { return { error: err.message }; }
});

// 7z packaging — uses system 7z binary
ipcMain.handle('package:create7z', async (_, projectPath, outputPath) => {
  try {
    // Check if 7z is available
    const which7z = safeExec('which 7z');
    if (!which7z.output) {
      // Try 7za (p7zip alternative)
      const which7za = safeExec('which 7za');
      if (!which7za.output) {
        return { error: '未找到 7z 命令。请先安装: brew install p7zip' };
      }
    }
    const bin = safeExec('which 7z').output || safeExec('which 7za').output;

    // Remove existing output file if present
    try { await fs.promises.unlink(outputPath); } catch {}

    // Build exclude args
    const excludes = '-xr!.DS_Store -xr!__MACOSX -xr!__pycache__ -xr!*.pyc -xr!._*';

    // Create 7z archive
    const cmd = `cd "${projectPath}" && "${bin}" a -t7z -mx=9 "${outputPath}" . ${excludes}`;
    const result = safeExec(cmd, 60000);

    if (result.error) {
      return { error: result.error };
    }

    const stat = await fs.promises.stat(outputPath);
    return { success: true, size: stat.size };
  } catch (err) {
    return { error: err.message };
  }
});

// ============================================
// === WINE / GPTK Integration (macOS only) ===
// ============================================

// Detect Wine installation (ARM64-aware)
ipcMain.handle('wine:detect', async () => {
  const systemArch = ARCH; // 'arm64' on Apple Silicon
  const rosetta = isRosettaInstalled();
  
  const results = {
    system: { arch: systemArch, rosetta },
    wine: null,
    wine64: null,
    crossover: null,
    gptk: null,
    homebrew_wine: null,
    errors: [],
  };

  // Helper: 检测 Wine 并验证架构兼容性
  const detectWineBinary = (binaryPath) => {
    if (!binaryPath) return null;
    
    const arch = checkBinaryArch(binaryPath);
    const compatible = (arch === 'arm64' || arch === 'universal' || 
                       (arch === 'x86_64' && rosetta) ||
                       systemArch === 'x86_64');
    
    // 尝试获取版本号（仅在兼容时）
    let version = null;
    if (compatible) {
      const versionResult = safeExec(`"${binaryPath}" --version`);
      version = versionResult.output;
      if (versionResult.error && versionResult.error.includes('bad CPU type')) {
        return { path: binaryPath, arch, compatible: false, error: 'bad CPU type — 需要 ARM64 版本的 Wine' };
      }
    }
    
    return { path: binaryPath, version, arch, compatible };
  };

  // Check standard wine
  const wineResult = safeExec('which wine');
  if (wineResult.output) {
    const info = detectWineBinary(wineResult.output);
    results.wine = info;
    if (info && !info.compatible) {
      results.errors.push(`Wine (${info.path}) 是 ${info.arch} 架构，当前系统是 ${systemArch}。${info.arch === 'i386' ? '需要安装 ARM64 版 Wine: brew install --cask wine-crossover' : '需要安装 Rosetta 2: softwareupdate --install-rosetta'}`);
    }
  }

  // Check wine64
  const wine64Result = safeExec('which wine64');
  if (wine64Result.output) {
    results.wine64 = detectWineBinary(wine64Result.output);
  }

  // Check CrossOver (always ARM64 native on modern versions)
  const crossoverPaths = [
    '/Applications/CrossOver.app',
    `${app.getPath('home')}/Applications/CrossOver.app`,
  ];
  for (const cp of crossoverPaths) {
    try {
      await fs.promises.access(cp);
      // CrossOver wine binary
      const cxWine = `${cp}/Contents/SharedSupport/CrossOver/bin/wine64`;
      let version = null;
      try {
        await fs.promises.access(cxWine);
        const vr = safeExec(`"${cxWine}" --version`);
        version = vr.output;
      } catch {}
      results.crossover = { path: cp, installed: true, wineBinary: cxWine, version };
      break;
    } catch {}
  }

  // Check GPTK (Game Porting Toolkit)
  const gptkPaths = [
    '/usr/local/opt/game-porting-toolkit',
    '/opt/homebrew/opt/game-porting-toolkit',
    `${app.getPath('home')}/Library/Apple/Game Porting Toolkit`,
  ];
  for (const gp of gptkPaths) {
    try {
      await fs.promises.access(gp);
      const gptkWineBin = `${gp}/bin/wine64`;
      const vr = safeExec(`"${gptkWineBin}" --version`);
      results.gptk = { path: gp, version: vr.output, wineBinary: gptkWineBin };
      break;
    } catch {}
  }

  // Check Homebrew wine-crossover (ARM64 native on Apple Silicon)
  const brewResult = safeExec('brew --prefix wine-crossover 2>/dev/null');
  if (brewResult.output) {
    const brewWineBin = `${brewResult.output}/bin/wine64`;
    const vr = safeExec(`"${brewWineBin}" --version`);
    results.homebrew_wine = { 
      path: brewResult.output, 
      wineBinary: brewWineBin,
      version: vr.output,
      arch: checkBinaryArch(brewWineBin),
    };
  } else {
    // Also try wine-stable
    const brewStable = safeExec('brew --prefix wine-stable 2>/dev/null');
    if (brewStable.output) {
      results.homebrew_wine = { path: brewStable.output };
    }
  }

  return results;
});

// Get Wine prefix (WINEPREFIX)
ipcMain.handle('wine:getPrefix', async () => {
  const defaultPrefix = path.join(app.getPath('home'), '.mcstudio-wine');
  return defaultPrefix;
});

// Initialize Wine prefix
ipcMain.handle('wine:initPrefix', async (_, wineBinary, prefix) => {
  try {
    await fs.promises.mkdir(prefix, { recursive: true });
    
    return new Promise((resolve, reject) => {
      const env = { ...process.env, WINEPREFIX: prefix, WINEDEBUG: '-all' };
      const proc = spawn(wineBinary, ['wineboot', '--init'], { env, timeout: 60000 });
      
      let output = '';
      proc.stdout.on('data', d => output += d.toString());
      proc.stderr.on('data', d => output += d.toString());
      
      proc.on('close', code => {
        resolve({ success: code === 0, output, code });
      });
      
      proc.on('error', err => reject({ error: err.message }));
    });
  } catch (err) {
    return { error: err.message };
  }
});

// Launch Windows executable through Wine
let wineProcess = null;

ipcMain.handle('wine:launch', async (_, wineBinary, exePath, prefix, args) => {
  try {
    if (wineProcess) {
      wineProcess.kill();
      wineProcess = null;
    }

    const env = {
      ...process.env,
      WINEPREFIX: prefix,
      WINEDEBUG: '-all',
      WINEARCH: 'win64',
    };

    // GPTK-specific settings
    if (wineBinary.includes('game-porting-toolkit')) {
      env.MTL_HUD_ENABLED = '0';
      env.WINEESYNC = '1';
    }

    wineProcess = spawn(wineBinary, [exePath, ...(args || [])], {
      env,
      stdio: 'pipe',
    });

    const logLines = [];

    wineProcess.stdout.on('data', (data) => {
      const line = data.toString();
      logLines.push(line);
      if (mainWindow) {
        mainWindow.webContents.send('wine:log', { type: 'stdout', data: line });
      }
    });

    wineProcess.stderr.on('data', (data) => {
      const line = data.toString();
      logLines.push(line);
      if (mainWindow) {
        mainWindow.webContents.send('wine:log', { type: 'stderr', data: line });
      }
    });

    wineProcess.on('close', (code) => {
      if (mainWindow) {
        mainWindow.webContents.send('wine:exit', { code });
      }
      wineProcess = null;
    });

    return { success: true, pid: wineProcess.pid };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('wine:kill', async () => {
  if (wineProcess) {
    wineProcess.kill('SIGTERM');
    wineProcess = null;
    return { success: true };
  }
  return { success: false, message: 'No process running' };
});

ipcMain.handle('wine:isRunning', async () => {
  return { running: wineProcess !== null, pid: wineProcess?.pid };
});

// === Dev Kit Management ===
ipcMain.handle('devkit:scan', async (_, searchPath) => {
  try {
    const results = [];
    const entries = await fs.promises.readdir(searchPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const exePath = path.join(searchPath, entry.name, 'Minecraft.Windows.exe');
      try {
        await fs.promises.access(exePath);
        results.push({
          name: entry.name,
          path: path.join(searchPath, entry.name),
          exePath,
        });
      } catch {}
      
      // Also check for bedrock_server.exe
      const serverExe = path.join(searchPath, entry.name, 'bedrock_server.exe');
      try {
        await fs.promises.access(serverExe);
        results.push({
          name: entry.name + ' (Server)',
          path: path.join(searchPath, entry.name),
          exePath: serverExe,
          isServer: true,
        });
      } catch {}
    }
    
    return results;
  } catch (err) {
    return { error: err.message };
  }
});

// Push test HTTP server (same as iOS version)
let pushServer = null;

ipcMain.handle('server:start', async (_, filePath, port) => {
  try {
    if (pushServer) { pushServer.close(); pushServer = null; }
    const express = require('express');
    const serverApp = express();
    const fileName = path.basename(filePath);
    serverApp.get('/download/:name', (req, res) => res.download(filePath, fileName));
    serverApp.get('/status', (req, res) => res.json({ status: 'running', file: fileName }));
    return new Promise((resolve) => {
      pushServer = serverApp.listen(port, '0.0.0.0', () => {
        const os = require('os');
        const ifaces = os.networkInterfaces();
        let localIP = '127.0.0.1';
        for (const name of Object.keys(ifaces)) {
          for (const i of ifaces[name]) {
            if (i.family === 'IPv4' && !i.internal) { localIP = i.address; break; }
          }
        }
        resolve({ success: true, url: `http://${localIP}:${port}/download/${encodeURIComponent(fileName)}`, ip: localIP, port });
      });
    });
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('server:stop', async () => {
  if (pushServer) { pushServer.close(); pushServer = null; return { success: true }; }
  return { success: false };
});

// ============================================
// === Mod Download & Install ===
// ============================================

// Download a file from URL to local path
ipcMain.handle('mod:download', async (_, url, destPath) => {
  try {
    const https = require('https');
    const http = require('http');
    
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const doDownload = (downloadUrl) => {
        protocol.get(downloadUrl, { headers: { 'User-Agent': 'MCStudio-macOS/1.0.0' } }, (response) => {
          // Handle redirects
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            doDownload(response.headers.location);
            return;
          }
          
          if (response.statusCode !== 200) {
            reject({ error: `HTTP ${response.statusCode}` });
            return;
          }
          
          const writeStream = fs.createWriteStream(destPath);
          let downloadedBytes = 0;
          const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
          
          response.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (totalBytes > 0 && mainWindow) {
              mainWindow.webContents.send('mod:downloadProgress', {
                downloaded: downloadedBytes,
                total: totalBytes,
                percent: Math.round((downloadedBytes / totalBytes) * 100),
              });
            }
          });
          
          response.pipe(writeStream);
          
          writeStream.on('finish', () => {
            writeStream.close();
            resolve({ success: true, path: destPath, size: downloadedBytes });
          });
          
          writeStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject({ error: err.message });
          });
        }).on('error', (err) => {
          reject({ error: err.message });
        });
      };
      
      doDownload(url);
    });
  } catch (err) {
    return { error: err.message };
  }
});

// Find Minecraft data directory in Wine prefix
ipcMain.handle('wine:findMCData', async () => {
  const prefix = path.join(app.getPath('home'), '.mcstudio-wine');
  const possiblePaths = [
    // Standard Windows Bedrock paths within Wine
    path.join(prefix, 'drive_c/Users', path.basename(app.getPath('home')), 'AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang'),
    // NetEase MC paths
    path.join(prefix, 'drive_c/Users', path.basename(app.getPath('home')), 'AppData/Local/Netease/MCStudio'),
    // Fallback: create a managed directory
    path.join(prefix, 'drive_c/mcstudio-mods'),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.promises.access(p);
      return { found: true, path: p };
    } catch {}
  }

  // Create managed directory as fallback
  const managedPath = possiblePaths[possiblePaths.length - 1];
  await fs.promises.mkdir(managedPath, { recursive: true });
  await fs.promises.mkdir(path.join(managedPath, 'behavior_packs'), { recursive: true });
  await fs.promises.mkdir(path.join(managedPath, 'resource_packs'), { recursive: true });
  await fs.promises.mkdir(path.join(managedPath, 'development_behavior_packs'), { recursive: true });
  await fs.promises.mkdir(path.join(managedPath, 'development_resource_packs'), { recursive: true });
  return { found: true, path: managedPath, created: true };
});

// Install a .mcpack / .mcaddon / .zip to MC data directory
ipcMain.handle('mod:install', async (_, filePath) => {
  try {
    const mcData = await new Promise((resolve) => {
      // Reuse the findMCData logic
      const prefix = path.join(app.getPath('home'), '.mcstudio-wine');
      const managedPath = path.join(prefix, 'drive_c/mcstudio-mods');
      resolve({ found: true, path: managedPath });
    });

    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);
    const behaviorBase = path.join(mcData.path, 'behavior_packs');
    const resourceBase = path.join(mcData.path, 'resource_packs');
    await fs.promises.mkdir(behaviorBase, { recursive: true });
    await fs.promises.mkdir(resourceBase, { recursive: true });

    const sanitizeName = (name) => (name || 'pack').replace(/[^a-zA-Z0-9_-]/g, '_');

    const findManifestInfo = async (rootDir) => {
      const queue = [{ dir: rootDir, depth: 0 }];
      while (queue.length > 0) {
        const { dir, depth } = queue.shift();
        for (const manifestName of ['pack_manifest.json', 'manifest.json']) {
          const mp = path.join(dir, manifestName);
          try {
            const content = await fs.promises.readFile(mp, 'utf-8');
            const manifest = JSON.parse(content);
            const moduleTypes = Array.isArray(manifest.modules)
              ? manifest.modules.map(m => m?.type).filter(Boolean)
              : [];
            const isResource = moduleTypes.includes('resources');
            const packType = isResource ? 'resource' : 'behavior';
            const displayName = manifest?.header?.name;
            return { manifestPath: mp, contentRoot: dir, packType, displayName };
          } catch {}
        }
        if (depth >= 3) continue;
        let entries = [];
        try {
          entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {}
        for (const e of entries) {
          if (e.isDirectory()) {
            queue.push({ dir: path.join(dir, e.name), depth: depth + 1 });
          }
        }
      }
      return null;
    };

    const installFromDir = async (sourceDir, fallbackName) => {
      const info = await findManifestInfo(sourceDir);
      const packType = info?.packType || 'behavior';
      const targetBase = packType === 'resource' ? resourceBase : behaviorBase;
      const resolvedName = sanitizeName(info?.displayName || fallbackName);
      const destDir = path.join(targetBase, resolvedName);
      const copyFrom = info?.contentRoot || sourceDir;
      await fs.promises.rm(destDir, { recursive: true, force: true });
      await fs.promises.cp(copyFrom, destDir, { recursive: true });
      return { path: destDir, packType };
    };

    const installArchivePack = async (archivePath, fallbackName) => {
      const tempDir = path.join(app.getPath('temp'), `mcpack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      await fs.promises.mkdir(tempDir, { recursive: true });
      try {
        require('child_process').execSync(`unzip -o "${archivePath}" -d "${tempDir}"`, { timeout: 30000 });
      } catch {
        const fallbackDest = path.join(behaviorBase, sanitizeName(fallbackName));
        await fs.promises.mkdir(fallbackDest, { recursive: true });
        await fs.promises.cp(archivePath, path.join(fallbackDest, path.basename(archivePath)));
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        return { path: fallbackDest, packType: 'behavior' };
      }
      const installedPack = await installFromDir(tempDir, fallbackName);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      return installedPack;
    };

    if (ext === '.mcpack' || ext === '.zip') {
      const installed = await installArchivePack(filePath, baseName);
      return { success: true, installed: installed.path, packType: installed.packType };
    }

    if (ext === '.mcaddon') {
      const tempDir = path.join(app.getPath('temp'), `mcaddon-${Date.now()}`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      try {
        require('child_process').execSync(`unzip -o "${filePath}" -d "${tempDir}"`, { timeout: 30000 });
      } catch {
        const destDir = path.join(behaviorBase, sanitizeName(baseName));
        await fs.promises.mkdir(destDir, { recursive: true });
        await fs.promises.cp(filePath, path.join(destDir, path.basename(filePath)));
        return { success: true, installed: destDir, packType: 'behavior' };
      }

      const innerEntries = await fs.promises.readdir(tempDir, { withFileTypes: true });
      const installed = [];

      for (const entry of innerEntries) {
        const innerPath = path.join(tempDir, entry.name);
        const innerExt = path.extname(entry.name).toLowerCase();
        const innerBase = path.basename(entry.name, innerExt);
        if (entry.isFile() && (innerExt === '.mcpack' || innerExt === '.zip')) {
          installed.push(await installArchivePack(innerPath, innerBase));
          continue;
        }
        if (entry.isDirectory()) {
          installed.push(await installFromDir(innerPath, entry.name));
        }
      }

      await fs.promises.rm(tempDir, { recursive: true, force: true });
      return {
        success: true,
        installed: installed.map(i => i.path),
        installedDetails: installed,
      };
    }

    const fallbackDest = path.join(behaviorBase, sanitizeName(baseName));
    await fs.promises.mkdir(fallbackDest, { recursive: true });
    await fs.promises.cp(filePath, path.join(fallbackDest, path.basename(filePath)));
    return { success: true, installed: fallbackDest, packType: 'behavior' };
  } catch (err) {
    return { error: err.message };
  }
});

// List installed mods
ipcMain.handle('mod:list', async () => {
  try {
    const prefix = path.join(app.getPath('home'), '.mcstudio-wine');
    const mods = [];

    for (const [packType, modsDir] of [
      ['behavior', path.join(prefix, 'drive_c/mcstudio-mods/behavior_packs')],
      ['resource', path.join(prefix, 'drive_c/mcstudio-mods/resource_packs')],
    ]) {
      try {
        await fs.promises.access(modsDir);
      } catch {
        continue;
      }

      const entries = await fs.promises.readdir(modsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const modPath = path.join(modsDir, entry.name);

        let manifest = null;
        for (const mp of ['pack_manifest.json', 'manifest.json']) {
          try {
            const content = await fs.promises.readFile(path.join(modPath, mp), 'utf-8');
            manifest = JSON.parse(content);
            break;
          } catch {}
        }

        mods.push({
          name: manifest?.header?.name || entry.name,
          path: modPath,
          manifest,
          dirName: entry.name,
          packType,
        });
      }
    }

    return mods;
  } catch (err) {
    return { error: err.message };
  }
});

// Uninstall mod
ipcMain.handle('mod:uninstall', async (_, modPath) => {
  try {
    await fs.promises.rm(modPath, { recursive: true, force: true });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// ============================================
// === Project Sync to Wine MC ===
// ============================================

// Sync project packs to Wine MC data directory for testing
ipcMain.handle('wine:syncProject', async (_, projectPath) => {
  try {
    const prefix = path.join(app.getPath('home'), '.mcstudio-wine');
    const mcDataPath = path.join(prefix, 'drive_c/mcstudio-mods');

    // Ensure target directories exist
    const devBpDir = path.join(mcDataPath, 'development_behavior_packs');
    const devRpDir = path.join(mcDataPath, 'development_resource_packs');
    await fs.promises.mkdir(devBpDir, { recursive: true });
    await fs.promises.mkdir(devRpDir, { recursive: true });

    // Read project name from project.json
    let projectName = path.basename(projectPath);
    try {
      const configContent = await fs.promises.readFile(path.join(projectPath, 'project.json'), 'utf-8');
      const config = JSON.parse(configContent);
      projectName = config.name || projectName;
    } catch {}

    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const synced = [];

    // Sync behavior_pack
    const bpSrc = path.join(projectPath, 'behavior_pack');
    try {
      await fs.promises.access(bpSrc);
      const bpDest = path.join(devBpDir, safeName);
      await fs.promises.rm(bpDest, { recursive: true, force: true });
      await fs.promises.cp(bpSrc, bpDest, { recursive: true });
      synced.push({ type: 'behavior_pack', dest: bpDest });
    } catch {}

    // Sync resource_pack
    const rpSrc = path.join(projectPath, 'resource_pack');
    try {
      await fs.promises.access(rpSrc);
      const rpDest = path.join(devRpDir, safeName);
      await fs.promises.rm(rpDest, { recursive: true, force: true });
      await fs.promises.cp(rpSrc, rpDest, { recursive: true });
      synced.push({ type: 'resource_pack', dest: rpDest });
    } catch {}

    return { success: true, synced, projectName: safeName };
  } catch (err) {
    return { error: err.message };
  }
});

// Launch game with project mods pre-synced
ipcMain.handle('wine:launchGame', async (_, wineBinary, exePath, prefix, projectPath) => {
  try {
    // First sync the project if provided
    if (projectPath) {
      const mcDataPath = path.join(app.getPath('home'), '.mcstudio-wine', 'drive_c/mcstudio-mods');
      const devBpDir = path.join(mcDataPath, 'development_behavior_packs');
      const devRpDir = path.join(mcDataPath, 'development_resource_packs');
      await fs.promises.mkdir(devBpDir, { recursive: true });
      await fs.promises.mkdir(devRpDir, { recursive: true });

      let safeName = path.basename(projectPath);
      try {
        const configContent = await fs.promises.readFile(path.join(projectPath, 'project.json'), 'utf-8');
        safeName = JSON.parse(configContent).name?.replace(/[^a-zA-Z0-9_-]/g, '_') || safeName;
      } catch {}

      const bpSrc = path.join(projectPath, 'behavior_pack');
      try {
        await fs.promises.access(bpSrc);
        const bpDest = path.join(devBpDir, safeName);
        await fs.promises.rm(bpDest, { recursive: true, force: true });
        await fs.promises.cp(bpSrc, bpDest, { recursive: true });
      } catch {}

      const rpSrc = path.join(projectPath, 'resource_pack');
      try {
        await fs.promises.access(rpSrc);
        const rpDest = path.join(devRpDir, safeName);
        await fs.promises.rm(rpDest, { recursive: true, force: true });
        await fs.promises.cp(rpSrc, rpDest, { recursive: true });
      } catch {}
    }

    // Now launch the game
    if (wineProcess) {
      wineProcess.kill();
      wineProcess = null;
    }

    const env = {
      ...process.env,
      WINEPREFIX: prefix,
      WINEDEBUG: '-all',
      WINEARCH: 'win64',
    };

    if (wineBinary.includes('game-porting-toolkit')) {
      env.MTL_HUD_ENABLED = '0';
      env.WINEESYNC = '1';
    }

    wineProcess = spawn(wineBinary, [exePath], { env, stdio: 'pipe' });

    wineProcess.stdout.on('data', (data) => {
      const line = data.toString();
      if (mainWindow) mainWindow.webContents.send('wine:log', { type: 'stdout', data: line });
    });

    wineProcess.stderr.on('data', (data) => {
      const line = data.toString();
      if (mainWindow) mainWindow.webContents.send('wine:log', { type: 'stderr', data: line });
    });

    wineProcess.on('close', (code) => {
      if (mainWindow) mainWindow.webContents.send('wine:exit', { code });
      wineProcess = null;
    });

    return { success: true, pid: wineProcess.pid };
  } catch (err) {
    return { error: err.message };
  }
});
