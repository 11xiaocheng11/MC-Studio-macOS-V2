import React, { useState } from 'react';

const TABS = ['本地作品', '云端列表'];

export default function WorksJavaAddon({ addToast, onNavigate }) {
  const [activeTab, setActiveTab] = useState('本地作品');

  const openUrl = (url) => {
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="works-page">
      <div className="works-page__header">
        <div className="works-page__tabs">
          {TABS.map(tab => (
            <button key={tab} className={`works-page__tab ${activeTab === tab ? 'works-page__tab--active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <div className="works-page__header-actions">
          <button className="btn btn--secondary btn--sm" onClick={() => onNavigate('content')}>📦 从内容库获取</button>
          <button className="btn btn--secondary btn--sm" onClick={() => addToast('info', '本地导入 — 支持 .jar / .zip 格式的 Java 版 Mod')}>📥 本地导入</button>
        </div>
      </div>
      <div className="works-page__body">
        <div className="works-page__content">
          <div className="works-page__empty">
            <div>{activeTab === '本地作品' ? '尚无 Java 版本地作品' : '尚无云端 Java 版作品'}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {activeTab === '本地作品'
                ? '请使用本地导入功能导入 Java 版 Mod，或从内容库（Modrinth）浏览下载'
                : '云端列表需要从开发者平台同步，请登录后刷新'}
            </div>
            <div style={{ fontSize: 11, marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 400, textAlign: 'left' }}>
              <strong>📋 Java 版开发说明：</strong><br/>
              • Java 版 Mod 基于 Fabric / Forge 框架开发<br/>
              • 可从 Modrinth 社区获取开源 Mod 源码<br/>
              • MC Studio 支持将 Java 版源码翻译为网易基岩版格式<br/>
              • 翻译流程：源码解构 → Python 2.7 重写 → 打包为基岩版 Addon
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn--primary btn--sm" onClick={() => onNavigate('content')}>
                🎮 浏览 Modrinth 内容库
              </button>
              <button className="btn btn--secondary btn--sm"
                onClick={() => openUrl('https://mc.163.com/dev/mcmanual/mc-dev/mcguide/introduction.html')}>
                📖 查看移植指南
              </button>
            </div>
          </div>
        </div>
        <div className="works-page__right">
          <div className="test-records">
            <div className="test-records__header">
              <span>测试存档记录</span>
              <div className="test-records__actions">
                <button className="btn btn--ghost btn--sm">🗑️</button>
                <button className="btn btn--ghost btn--sm">▶️</button>
              </div>
            </div>
            <div className="test-records__empty">此作品暂无测试记录<br/>请移动鼠标至作品后<br/>点击开发测试</div>
          </div>
          {/* Java Porting Flow */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>🔄 移植工作流</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              1. Modrinth 获取源码<br/>
              2. 分析 Java 逻辑结构<br/>
              3. Python 2.7 重写<br/>
              4. 构建 behavior_pack<br/>
              5. 打包为 .mcaddon<br/>
              6. 上传开发者平台
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
