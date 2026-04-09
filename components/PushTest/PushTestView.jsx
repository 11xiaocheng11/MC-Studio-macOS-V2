import React, { useState } from 'react';
import QRCode from 'qrcode';
import useProjectStore from '../../store/projectStore';

export default function PushTestView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const [serverRunning, setServerRunning] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const generateQR = async (url) => {
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      addLog(`二维码生成失败: ${err.message}`, 'error');
      addToast('error', '二维码生成失败，请复制链接手动打开');
    }
  };

  const startServer = async () => {
    if (!currentProject) {
      addToast('error', '请先打开一个项目');
      return;
    }

    addLog('开始打包项目...', 'info');

    try {
      // First package the project
      const outputPath = `${currentProject.path}/../${currentProject.name}.mcaddon`;
      if (window.electronAPI) {
        const pkgResult = await window.electronAPI.package.create(currentProject.path, outputPath);
        if (!pkgResult.success) {
          addLog(`打包失败: ${pkgResult.error}`, 'error');
          addToast('error', '打包失败');
          return;
        }
        addLog(`打包完成 (${(pkgResult.size / 1024).toFixed(1)} KB)`, 'success');

        // Start HTTP server
        addLog('启动推送服务器...', 'info');
        const port = 8976 + Math.floor(Math.random() * 100);
        const result = await window.electronAPI.server.start(outputPath, port);

        if (result.success) {
          setServerRunning(true);
          setServerInfo(result);
          await generateQR(result.url);
          addLog(`服务器已启动: ${result.url}`, 'success');
          addLog('请用 iPhone 扫描二维码下载 .mcaddon 文件', 'info');
          addToast('success', '推送服务器已启动，请扫描二维码');
        }
      }
    } catch (err) {
      addLog(`错误: ${err.message}`, 'error');
      addToast('error', `启动失败: ${err.message}`);
    }
  };

  const stopServer = async () => {
    if (window.electronAPI) {
      await window.electronAPI.server.stop();
    }
    setServerRunning(false);
    setServerInfo(null);
    setQrDataUrl(null);
    addLog('服务器已停止', 'info');
    addToast('info', '推送服务器已停止');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-header__title">📱 推送测试</h1>
        <div className="page-header__actions">
          {serverRunning ? (
            <button className="btn btn--danger" onClick={stopServer}>⏹ 停止服务器</button>
          ) : (
            <button className="btn btn--primary btn--pixel" onClick={startServer}>
              PUSH TO iPHONE
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {!currentProject ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ fontSize: 64 }}>📱</div>
            <div className="empty-state__title">NO PROJECT</div>
            <div className="empty-state__desc">请先在项目管理中打开一个项目</div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* QR Code & Instructions */}
            <div style={{ flex: 1 }}>
              <div className="glass-panel" style={{ padding: 32 }}>
                {serverRunning && qrDataUrl ? (
                  <div className="qr-display">
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'var(--accent-primary)' }}>
                      SCAN WITH iPHONE
                    </div>
                    <div className="qr-display__code">
                      <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200, imageRendering: 'pixelated' }} />
                    </div>
                    <div className="qr-display__url">{serverInfo?.url}</div>
                    <div className="qr-display__hint">
                      用 iPhone 相机扫描二维码，Safari 会自动下载 .mcaddon 文件，然后选择用《我的世界》打开即可导入
                    </div>

                    {/* Server Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                      <span className="statusbar__dot" />
                      <span style={{ fontSize: 12, color: 'var(--color-success)' }}>服务器运行中</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {serverInfo?.ip}:{serverInfo?.port}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="qr-display">
                    <div style={{ fontSize: 80, opacity: 0.2 }}>📱</div>
                    <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, color: 'var(--text-secondary)' }}>
                      READY TO PUSH
                    </div>
                    <div className="qr-display__hint">
                      点击「PUSH TO iPhone」按钮开始推送测试流程
                    </div>

                    {/* Workflow steps */}
                    <div style={{ marginTop: 24, textAlign: 'left', width: '100%', maxWidth: 400 }}>
                      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 12 }}>
                        WORKFLOW
                      </div>
                      {[
                        { step: 1, text: '自动打包项目为 .mcaddon', icon: '📦' },
                        { step: 2, text: '启动本地 HTTP 服务器', icon: '🌐' },
                        { step: 3, text: '生成二维码下载链接', icon: '📷' },
                        { step: 4, text: 'iPhone 扫码下载文件', icon: '📱' },
                        { step: 5, text: 'iOS 自动用 MC 打开导入', icon: '⛏' },
                        { step: 6, text: '游戏内测试你的模组！', icon: '🎮' },
                      ].map(item => (
                        <div key={item.step} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '8px 12px', marginBottom: 4,
                          background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                        }}>
                          <span style={{ fontSize: 18 }}>{item.icon}</span>
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            Step {item.step}: {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Logs */}
            <div style={{ width: 360 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 8 }}>
                SERVER LOG
              </div>
              <div style={{
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                height: 'calc(100vh - 280px)',
                overflow: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                lineHeight: 1.8,
              }}>
                {logs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                    等待操作...
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} style={{
                      color: log.type === 'error' ? 'var(--color-error)'
                        : log.type === 'success' ? 'var(--color-success)'
                          : 'var(--text-secondary)',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
