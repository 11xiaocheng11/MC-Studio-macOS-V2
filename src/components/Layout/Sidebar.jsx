import React, { useState } from 'react';

export default function Sidebar({ activeView, onViewChange, theme, onToggleTheme }) {
  const [worksExpanded, setWorksExpanded] = useState(true);

  const isWorksView = activeView.startsWith('works_');

  const navItems = [
    { id: 'home', icon: '🏠', label: '首页' },
    { id: 'create', icon: '✏️', label: '创作' },
    {
      id: 'works', icon: '📁', label: '作品库',
      expandable: true,
      children: [
        { id: 'works_bedrock_addon', label: '基岩版组件' },
        { id: 'works_bedrock_server', label: '基岩版服务器' },
        { id: 'works_java_addon', label: 'Java版组件' },
        { id: 'works_java_server', label: 'Java版服务器' },
      ],
    },
    { id: 'content', icon: '🎮', label: '内容库' },
    { id: 'manage', icon: '📦', label: '发布与管理' },
  ];

  const bottomItems = [
    { id: 'wine', icon: '🍷', label: 'Wine/GPTK' },
    { id: 'push', icon: '📱', label: '推送测试' },
  ];

  const openUrl = (url) => {
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="sidebar-v2">
      {/* User Avatar */}
      <div className="sidebar-v2__user">
        <div className="sidebar-v2__avatar">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect fill='%23333' width='64' height='64'/%3E%3Crect fill='%23555' x='16' y='8' width='32' height='32' rx='4'/%3E%3Crect fill='%23444' x='16' y='40' width='32' height='20' rx='4'/%3E%3Crect fill='%2300d2ff' x='22' y='18' width='8' height='8'/%3E%3Crect fill='%2300d2ff' x='34' y='18' width='8' height='8'/%3E%3C/svg%3E" alt="avatar" />
        </div>
        <div className="sidebar-v2__user-info">
          <div className="sidebar-v2__username">macOS开发者</div>
          <div className="sidebar-v2__level">
            <span className="sidebar-v2__level-dot" />
            元气新星 Lv.1
          </div>
        </div>
      </div>

      {/* System Messages */}
      <div
        className="sidebar-v2__messages"
        onClick={() => onViewChange('home')}
      >
        <span>🔔</span>
        <span>系统消息</span>
        <span className="sidebar-v2__badge">3</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-v2__nav">
        {navItems.map(item => {
          const isActive = item.expandable
            ? isWorksView
            : activeView === item.id;

          return (
            <div key={item.id}>
              <div
                className={`sidebar-v2__item ${isActive ? 'sidebar-v2__item--active' : ''}`}
                onClick={() => {
                  if (item.expandable) {
                    setWorksExpanded(!worksExpanded);
                    if (!isWorksView) onViewChange('works_bedrock_addon');
                  } else {
                    onViewChange(item.id);
                  }
                }}
              >
                <span className="sidebar-v2__item-icon">{item.icon}</span>
                <span className="sidebar-v2__item-label">{item.label}</span>
                {item.expandable && (
                  <span className={`sidebar-v2__expand-arrow ${worksExpanded ? 'sidebar-v2__expand-arrow--open' : ''}`}>
                    ▸
                  </span>
                )}
              </div>

              {/* Expandable Children */}
              {item.expandable && worksExpanded && (
                <div className="sidebar-v2__children">
                  {item.children.map(child => (
                    <div
                      key={child.id}
                      className={`sidebar-v2__child ${activeView === child.id ? 'sidebar-v2__child--active' : ''}`}
                      onClick={() => onViewChange(child.id)}
                    >
                      {child.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Tools Section */}
      <div className="sidebar-v2__bottom">
        {bottomItems.map(item => (
          <div
            key={item.id}
            className={`sidebar-v2__item ${activeView === item.id ? 'sidebar-v2__item--active' : ''}`}
            onClick={() => onViewChange(item.id)}
          >
            <span className="sidebar-v2__item-icon">{item.icon}</span>
            <span className="sidebar-v2__item-label">{item.label}</span>
          </div>
        ))}

        {/* External Links */}
        <div className="sidebar-v2__item" onClick={() => openUrl('https://mc.163.com/dev/mcmanual/mc-dev/mcdocs/1-ModAPI/0-Intro.html')}>
          <span className="sidebar-v2__item-icon">📘</span>
          <span className="sidebar-v2__item-label">API 文档</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>↗</span>
        </div>
        <div className="sidebar-v2__item" onClick={() => openUrl('https://mc.163.com/dev/')}>
          <span className="sidebar-v2__item-icon">🌐</span>
          <span className="sidebar-v2__item-label">开发者平台</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>↗</span>
        </div>

        {/* Theme Toggle */}
        <div className="theme-toggle" onClick={onToggleTheme}>
          <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          <span>{theme === 'dark' ? '深色模式' : '浅色模式'}</span>
          <div className="theme-toggle__track" style={{ marginLeft: 'auto' }}>
            <div className="theme-toggle__thumb" />
          </div>
        </div>
      </div>
    </div>
  );
}
