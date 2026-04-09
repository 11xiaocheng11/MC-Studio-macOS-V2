import React, { useState, useEffect, useRef } from 'react';
import useProjectStore from '../../store/projectStore';

export default function WineManagerView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const [wineStatus, setWineStatus] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [selectedBackend, setSelectedBackend] = useState(null);
  const [winePrefix, setWinePrefix] = useState('');
  const [prefixReady, setPrefixReady] = useState(false);
  const [initializingPrefix, setInitializingPrefix] = useState(false);
  const [devKits, setDevKits] = useState([]);
  const [devKitPath, setDevKitPath] = useState('');
  const [scanning, setScanning] = useState(false);
  const [wineRunning, setWineRunning] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('environment'); // 'environment' | 'gametest' | 'logs'
  const logsEndRef = useRef(null);

  useEffect(() => {
    detectWine();
    loadPrefix();
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.wine.onLog((data) => {
      setLogs(prev => [...prev.slice(-500), {
        time: new Date().toLocaleTimeString(),
        type: data.type,
        text: data.data,
      }]);
    });
    window.electronAPI.wine.onExit((data) => {
      setWineRunning(false);
      setLogs(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        type: 'system',
        text: `进程已退出 (code: ${data.code})`,
      }]);
      addToast(data.code === 0 ? 'info' : 'warning', `Wine 进程已退出 (code: ${data.code})`);
    });
    return () => { window.electronAPI?.wine.removeListeners(); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const detectWine = async () => {
    if (!window.electronAPI) {
      setWineStatus({
        system: { arch: 'unknown', rosetta: false },
        wine: null, wine64: null, crossover: null, gptk: null, homebrew_wine: null,
        errors: [],
      });
      return;
    }
    setDetecting(true);
    try {
      const result = await window.electronAPI.wine.detect();
      setWineStatus(result);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(err => addToast('warning', err));
      }
      // Auto-select best COMPATIBLE backend
      if (result.gptk) {
        setSelectedBackend({ type: 'gptk', ...result.gptk, binary: result.gptk.wineBinary || `${result.gptk.path}/bin/wine64` });
      } else if (result.crossover?.installed) {
        setSelectedBackend({ type: 'crossover', ...result.crossover, binary: result.crossover.wineBinary });
      } else if (result.homebrew_wine) {
        setSelectedBackend({ type: 'homebrew', ...result.homebrew_wine, binary: result.homebrew_wine.wineBinary });
      } else if (result.wine64?.compatible) {
        setSelectedBackend({ type: 'wine64', ...result.wine64, binary: result.wine64.path });
      } else if (result.wine?.compatible) {
        setSelectedBackend({ type: 'wine', ...result.wine, binary: result.wine.path });
      }
    } catch (err) {
      addToast('error', `Wine 检测失败: ${err.message}`);
    }
    setDetecting(false);
  };

  const loadPrefix = async () => {
    if (!window.electronAPI) return;
    const prefix = await window.electronAPI.wine.getPrefix();
    setWinePrefix(prefix);
    const exists = await window.electronAPI.fs.exists(prefix);
    setPrefixReady(exists);
  };

  const initPrefix = async () => {
    if (!selectedBackend || !winePrefix) { addToast('error', '请先选择 Wine 后端'); return; }
    setInitializingPrefix(true);
    addToast('info', '正在初始化 Wine 环境...');
    const result = await window.electronAPI.wine.initPrefix(selectedBackend.binary, winePrefix);
    if (result.success || result.code === 0) {
      setPrefixReady(true);
      addToast('success', 'Wine 环境初始化完成！');
    } else {
      addToast('error', `初始化失败: ${result.error || result.output}`);
    }
    setInitializingPrefix(false);
  };

  const scanDevKits = async () => {
    if (!devKitPath) {
      if (window.electronAPI) {
        const dir = await window.electronAPI.dialog.openDirectory();
        if (dir) setDevKitPath(dir);
        else return;
      }
    }
    setScanning(true);
    if (window.electronAPI) {
      const results = await window.electronAPI.devkit.scan(devKitPath);
      if (results.error) {
        addToast('error', `扫描失败: ${results.error}`);
      } else {
        setDevKits(results);
        addToast('success', `发现 ${results.length} 个开发包`);
      }
    }
    setScanning(false);
  };

  const syncProjectToWine = async () => {
    if (!currentProject) { addToast('error', '请先在项目管理中打开一个项目'); return; }
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await window.electronAPI.wine.syncProject(currentProject.path);
      if (result.success) {
        setSyncResult(result);
        addToast('success', `✅ 已同步 ${result.synced.length} 个包到 Wine MC 目录`);
      } else {
        addToast('error', `同步失败: ${result.error}`);
      }
    } catch (err) {
      addToast('error', `同步异常: ${err.message}`);
    }
    setSyncing(false);
  };

  const launchWithProject = async (kit) => {
    if (!selectedBackend) { addToast('error', '请先选择 Wine 后端'); return; }
    if (!prefixReady) { addToast('error', '请先初始化 Wine 环境'); return; }

    setLogs([]);
    const projectPath = currentProject?.path || null;
    if (projectPath) {
      addToast('info', `正在同步模组到 Wine 并启动 ${kit.name}...`);
    } else {
      addToast('info', `正在启动 ${kit.name}...`);
    }

    const result = await window.electronAPI.wine.launchGame(
      selectedBackend.binary,
      kit.exePath,
      winePrefix,
      projectPath
    );

    if (result.success) {
      setWineRunning(true);
      setActiveTab('logs');
      addToast('success', `已启动 (PID: ${result.pid})${projectPath ? '，模组已同步' : ''}`);
    } else {
      addToast('error', `启动失败: ${result.error}`);
    }
  };

  const launchDevKit = async (kit) => {
    if (!selectedBackend) { addToast('error', '请先选择 Wine 后端'); return; }
    if (!prefixReady) { addToast('error', '请先初始化 Wine 环境'); return; }
    setLogs([]);
    addToast('info', `正在启动 ${kit.name}...`);
    const result = await window.electronAPI.wine.launch(selectedBackend.binary, kit.exePath, winePrefix, []);
    if (result.success) {
      setWineRunning(true);
      setActiveTab('logs');
      addToast('success', `已启动 (PID: ${result.pid})`);
    } else {
      addToast('error', `启动失败: ${result.error}`);
    }
  };

  const killWine = async () => {
    if (window.electronAPI) {
      await window.electronAPI.wine.kill();
      setWineRunning(false);
      addToast('info', '已终止 Wine 进程');
    }
  };

  const getBackendIcon = (type) => {
    switch (type) {
      case 'gptk': return '🎮';
      case 'wine': case 'wine64': return '🍷';
      case 'crossover': return '🔄';
      default: return '❓';
    }
  };

  const backends = wineStatus ? [
    wineStatus.gptk && { type: 'gptk', name: 'Game Porting Toolkit', ...wineStatus.gptk, binary: wineStatus.gptk?.wineBinary || `${wineStatus.gptk?.path}/bin/wine64`, recommended: true },
    wineStatus.homebrew_wine && { type: 'homebrew', name: 'Homebrew Wine (ARM64)', ...wineStatus.homebrew_wine, binary: wineStatus.homebrew_wine?.wineBinary },
    wineStatus.crossover?.installed && { type: 'crossover', name: 'CrossOver', ...wineStatus.crossover, binary: wineStatus.crossover?.wineBinary },
    wineStatus.wine64?.compatible && { type: 'wine64', name: 'Wine 64-bit', ...wineStatus.wine64, binary: wineStatus.wine64?.path },
    wineStatus.wine?.compatible && { type: 'wine', name: 'Wine', ...wineStatus.wine, binary: wineStatus.wine?.path },
  ].filter(Boolean) : [];

  const incompatibleBackends = wineStatus ? [
    wineStatus.wine && !wineStatus.wine.compatible && wineStatus.wine,
    wineStatus.wine64 && !wineStatus.wine64.compatible && wineStatus.wine64,
  ].filter(Boolean) : [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-header__title">🍷 Wine / GPTK 管理</h1>
        <div className="page-header__actions">
          <button className="btn btn--secondary" onClick={detectWine} disabled={detecting}>
            {detecting ? '⏳ 检测中...' : '🔍 重新检测'}
          </button>
          {wineRunning && (
            <button className="btn btn--danger" onClick={killWine}>⏹ 终止进程</button>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'environment', label: '🔧 环境配置' },
          { id: 'gametest', label: '🎮 游戏测试', badge: currentProject ? currentProject.name : null },
          { id: 'logs', label: '📟 运行日志', badge: wineRunning ? '运行中' : null },
        ].map(tab => (
          <button
            key={tab.id}
            className="btn btn--ghost btn--sm"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              borderRadius: 0,
              fontSize: 12,
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab.label}
            {tab.badge && (
              <span className="tag tag--addon" style={{ marginLeft: 8, fontSize: 9 }}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

        {/* ========== ENVIRONMENT TAB ========== */}
        {activeTab === 'environment' && (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Wine Backend Detection */}
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 16 }}>
                  WINE BACKEND STATUS
                </div>
                {!wineStatus ? (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>
                    {detecting ? '正在检测 Wine 环境...' : '点击「重新检测」扫描系统'}
                  </div>
                ) : (
                  <>
                    {/* System info */}
                    {wineStatus.system && (
                      <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', fontSize: 11 }}>
                        <span style={{ color: 'var(--text-muted)' }}>系统: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                          {wineStatus.system.arch === 'arm64' ? '🍎 Apple Silicon (ARM64)' : '💻 Intel (x86_64)'}
                        </span>
                        {wineStatus.system.arch === 'arm64' && (
                          <span style={{ marginLeft: 8, color: wineStatus.system.rosetta ? 'var(--color-success)' : 'var(--color-warning)', fontSize: 10 }}>
                            Rosetta 2: {wineStatus.system.rosetta ? '✅ 已安装' : '❌ 未安装'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Incompatible warning */}
                    {incompatibleBackends.length > 0 && (
                      <div style={{ marginBottom: 12, padding: 12, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ color: '#ff6b6b', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>⚠️ 检测到不兼容的 Wine</div>
                        {incompatibleBackends.map((b, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {b.path} — {b.arch} 架构 {b.error && `(${b.error})`}
                          </div>
                        ))}
                        <div style={{ fontSize: 11, color: '#ff9999', marginTop: 6 }}>Apple Silicon 需要 ARM64 版 Wine。</div>
                      </div>
                    )}

                    {backends.length === 0 ? (
                      <div style={{ padding: 20 }}>
                        <div style={{ textAlign: 'center', color: 'var(--color-warning)', marginBottom: 16 }}>⚠️ 未检测到兼容的 Wine 环境</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>
                            {wineStatus.system?.arch === 'arm64' ? '🍎 Apple Silicon 安装指南:' : '安装方式（推荐顺序）：'}
                          </div>
                          {[
                            { title: '🎮 Game Porting Toolkit（推荐）', desc: 'Apple 官方工具，DirectX 12 → Metal 原生转译。', cmd: 'brew tap apple/apple && brew install apple/apple/game-porting-toolkit' },
                            { title: '🍷 Wine Crossover（推荐 ARM64）', desc: 'CodeWeavers 维护的 ARM64 原生 Wine。', cmd: 'brew install --cask --no-quarantine gcenx/wine/wine-crossover' },
                            { title: '🔄 CrossOver（商业版）', desc: '图形化界面，开箱即用。visit codeweavers.com' },
                          ].map((item, i) => (
                            <div key={i} className="card" style={{ cursor: 'default', marginBottom: 8, padding: 12 }}>
                              <strong>{item.title}</strong>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.desc}</div>
                              {item.cmd && <code style={{ fontSize: 10, color: 'var(--accent-primary)', display: 'block', marginTop: 4 }}>{item.cmd}</code>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {backends.map(backend => (
                          <div
                            key={backend.type}
                            className="card"
                            style={{
                              borderColor: selectedBackend?.type === backend.type ? 'var(--accent-primary)' : undefined,
                              boxShadow: selectedBackend?.type === backend.type ? 'var(--accent-glow)' : undefined,
                              padding: 14,
                            }}
                            onClick={() => setSelectedBackend(backend)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 24 }}>{getBackendIcon(backend.type)}</span>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                                    {backend.name}
                                    {backend.recommended && <span className="tag tag--addon" style={{ marginLeft: 8 }}>推荐</span>}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {backend.version || backend.path}
                                  </div>
                                </div>
                              </div>
                              {selectedBackend?.type === backend.type && (
                                <span style={{ color: 'var(--accent-primary)', fontSize: 18 }}>✓</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Wine Prefix */}
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                  WINE PREFIX (环境)
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                  {winePrefix || '~/.mcstudio-wine'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`statusbar__dot ${prefixReady ? '' : 'statusbar__dot--warning'}`} />
                    <span style={{ fontSize: 12, color: prefixReady ? 'var(--color-success)' : 'var(--color-warning)' }}>
                      {prefixReady ? '已就绪' : '未初始化'}
                    </span>
                  </div>
                  {!prefixReady && (
                    <button className="btn btn--primary btn--sm" onClick={initPrefix} disabled={initializingPrefix || !selectedBackend}>
                      {initializingPrefix ? '⏳ 初始化中...' : '🔧 初始化环境'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right column: Quick status */}
            <div style={{ width: 320 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 16 }}>
                  QUICK STATUS
                </div>
                {[
                  { label: 'Wine 后端', value: selectedBackend?.name || '未选择', ok: !!selectedBackend },
                  { label: '环境前缀', value: prefixReady ? '已就绪' : '未初始化', ok: prefixReady },
                  { label: '当前项目', value: currentProject?.name || '无', ok: !!currentProject },
                  { label: '游戏进程', value: wineRunning ? '运行中' : '未启动', ok: wineRunning },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: item.ok ? 'var(--color-success)' : 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.ok ? '✅' : '⬜'} {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== GAME TEST TAB ========== */}
        {activeTab === 'gametest' && (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Project Sync */}
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                  📂 PROJECT SYNC — 同步模组到 Wine
                </div>
                {currentProject ? (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                      background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: 12,
                    }}>
                      <div className="card__icon" style={{
                        background: 'linear-gradient(135deg, #7b2ff7, #00d2ff)',
                        width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>🔧</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{currentProject.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{currentProject.path}</div>
                      </div>
                      <button className="btn btn--primary btn--sm" onClick={syncProjectToWine} disabled={syncing}>
                        {syncing ? '⏳ 同步中...' : '🔄 同步到 Wine'}
                      </button>
                    </div>

                    {syncResult && (
                      <div style={{ padding: 12, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600, marginBottom: 6 }}>✅ 同步完成</div>
                        {syncResult.synced.map((s, i) => (
                          <div key={i} style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {s.type} → {s.dest}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      同步会将项目的 <code>behavior_pack</code> 和 <code>resource_pack</code> 复制到 Wine MC 的
                      <code>development_*_packs</code> 目录，支持游戏内热加载。
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    请先在「项目管理」中打开一个项目
                  </div>
                )}
              </div>

              {/* Dev Kit Scanner */}
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                  🎮 MOD PC 开发包
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <input
                    className="input"
                    placeholder="开发包目录路径..."
                    value={devKitPath}
                    onChange={e => setDevKitPath(e.target.value)}
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <button className="btn btn--secondary btn--sm" onClick={scanDevKits} disabled={scanning}>
                    {scanning ? '⏳' : '📂'} 扫描
                  </button>
                </div>

                {devKits.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {devKits.map((kit, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {kit.isServer ? '🖥' : '🎮'} {kit.name}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {kit.exePath}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn--primary btn--sm btn--pixel"
                            onClick={() => launchWithProject(kit)}
                            disabled={wineRunning || !selectedBackend || !prefixReady}
                            style={{ fontSize: 9 }}
                            title={currentProject ? `同步 ${currentProject.name} 并启动` : '直接启动'}
                          >
                            {currentProject ? '🔄 SYNC & LAUNCH' : 'LAUNCH'}
                          </button>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => launchDevKit(kit)}
                            disabled={wineRunning || !selectedBackend || !prefixReady}
                            style={{ fontSize: 9 }}
                            title="不同步，直接启动"
                          >
                            ▶
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>
                    扫描开发包目录以查找可用的 MC 开发包
                  </div>
                )}
              </div>

              {/* Test Workflow Guide */}
              <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                  📋 TESTING WORKFLOW
                </div>
                {[
                  { step: 1, text: '在「项目管理」中打开/创建你的 Mod 项目', icon: '📁', done: !!currentProject },
                  { step: 2, text: '运行「打包预检」确保结构合规', icon: '🔍', done: false },
                  { step: 3, text: '点击「同步到 Wine」将模组推送到游戏目录', icon: '🔄', done: !!syncResult },
                  { step: 4, text: '扫描并选择「Mod PC 开发包」', icon: '🎮', done: devKits.length > 0 },
                  { step: 5, text: '点击「SYNC & LAUNCH」启动游戏测试', icon: '🚀', done: wineRunning },
                  { step: 6, text: '在游戏中验证模组效果', icon: '✅', done: false },
                ].map(item => (
                  <div key={item.step} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', marginBottom: 4,
                    background: item.done ? 'rgba(0,230,118,0.06)' : 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${item.done ? 'rgba(0,230,118,0.15)' : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, color: item.done ? 'var(--color-success)' : 'var(--text-secondary)', flex: 1 }}>
                      Step {item.step}: {item.text}
                    </span>
                    {item.done && <span style={{ color: 'var(--color-success)', fontSize: 14 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Mini log */}
            <div style={{ width: 360 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 8 }}>
                QUICK LOG
              </div>
              <div style={{
                background: '#000', borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0,210,255,0.1)',
                padding: 12, height: 300, overflow: 'auto',
                fontFamily: 'var(--font-mono)', fontSize: 10, lineHeight: 1.5,
              }}>
                {logs.slice(-50).map((log, i) => (
                  <div key={i} style={{ color: log.type === 'stderr' ? '#ff6b6b' : log.type === 'system' ? '#00d2ff' : '#a0a0a0' }}>
                    <span style={{ color: '#555' }}>[{log.time}]</span> {log.text}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div style={{ color: '#444', textAlign: 'center', padding: 20 }}>等待启动...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== LOGS TAB ========== */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>WINE OUTPUT ({logs.length} lines)</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {wineRunning && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="statusbar__dot" />
                    <span style={{ fontSize: 10, color: 'var(--color-success)', fontFamily: 'var(--font-ui)' }}>运行中</span>
                  </span>
                )}
                <button className="btn btn--ghost btn--sm" onClick={() => setLogs([])} style={{ fontSize: 10 }}>🗑 清空</button>
              </div>
            </div>
            <div style={{
              background: '#000000',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0,210,255,0.1)',
              padding: 12,
              height: 'calc(100vh - 260px)',
              overflow: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              lineHeight: 1.6,
            }}>
              {logs.length === 0 ? (
                <div style={{ color: '#333', textAlign: 'center', padding: 40 }}>
                  <pre style={{ color: '#444', fontSize: 10 }}>{`
  ╔══════════════════════════════╗
  ║   MC Studio macOS Terminal   ║
  ║   Wine / GPTK Output        ║
  ╚══════════════════════════════╝
                  `}</pre>
                  <div style={{ color: '#555', marginTop: 16 }}>等待启动...</div>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} style={{
                    color: log.type === 'stderr' ? '#ff6b6b' : log.type === 'system' ? '#00d2ff' : '#a0a0a0',
                    wordBreak: 'break-all',
                  }}>
                    <span style={{ color: '#555' }}>[{log.time}]</span> {log.text}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
