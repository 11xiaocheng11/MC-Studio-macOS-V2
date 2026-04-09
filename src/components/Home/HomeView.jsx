import React from 'react';
import useProjectStore from '../../store/projectStore';

/* ── 网易我的世界开发者生态 — 真实链接 ── */
const QUICK_LINKS = [
  { icon: '📖', label: '开发指南',   color: '#e74c3c', size: 'lg', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcguide/introduction.html' },
  { icon: '🎓', label: '教学课程',   color: '#2ecc71', size: 'lg', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcguide/18-newcomer_guide/0-dev_env_setup.html' },
  { icon: '📘', label: 'API文档',    color: '#3498db', size: 'lg', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcdocs/1-ModAPI/0-Intro.html' },
  { icon: '🌐', label: '开发者官网',  url: 'https://mc.163.com/dev/' },
  { icon: '📱', label: '开发者公众号', url: 'https://mc.163.com/dev/', desc: '微信搜索「我的世界开发者」' },
  { icon: '📺', label: '开发者B站',   url: 'https://space.bilibili.com/1869112584' },
  { icon: '💬', label: '开发者QQ频道', url: 'https://qun.qq.com/qqweb/qunpro/share?inviteCode=1W4AOFq', desc: 'QQ频道/群' },
  { icon: '🖥️', label: '开发者平台',  url: 'https://mc-launcher.webapp.163.com/app/index.html' },
  { icon: '❓', label: '帮助中心',    url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcguide/introduction.html' },
  { icon: '💭', label: '开发者论坛',  url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcguide/18-newcomer_guide/0-dev_env_setup.html' },
  { icon: '📝', label: '问题反馈',    url: 'https://mc.163.com/dev/' },
  { icon: '🛡️', label: '涉未成年举报', url: 'https://mc.163.com/fcm.html' },
];

/* ── 开发者公告/动态 ── */
const ANNOUNCEMENTS = [
  { title: '⚡ MC Studio macOS v1.0 发布', desc: '支持 Mod 纯代码开发、一键打包（.mcaddon/.zip/.7z）、Modrinth 社区浏览', date: '2026-04-09' },
  { title: '📦 打包系统增强', desc: '新增 .zip 和 .7z 打包格式，自动排除 __MACOSX 和 ._* 幽灵文件', date: '2026-04-09' },
  { title: '🍷 Wine/GPTK 集成', desc: '支持在 macOS 上通过 Wine 运行 Minecraft.Windows.exe 进行调试', date: '2026-04-08' },
  { title: '📚 开发规范提醒', desc: '网易版 Mod 必须使用 Python 2.7 语法，禁止中文路径，pack_manifest.json 必配', date: '2026-04-07' },
];

export default function HomeView({ addToast, onNavigate }) {
  const projects = useProjectStore(s => s.projects);
  const recentProjects = projects.slice(0, 5);

  const openUrl = (url) => {
    if (url) {
      if (window.electronAPI?.shell?.openExternal) {
        window.electronAPI.shell.openExternal(url);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="home-view">
      {/* Left: Main Content */}
      <div className="home-view__main">
        {/* Banner */}
        <div className="home-banner">
          <div className="home-banner__overlay">
            <div className="home-banner__title">我的世界</div>
            <div className="home-banner__subtitle">开发者报刊</div>
            <div className="home-banner__desc">
              MC Studio macOS — 专为 macOS 开发者打造的网易版我的世界模组开发工具
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn--primary btn--sm" onClick={() => onNavigate('create')}>
                🚀 开始创作
              </button>
              <button className="btn btn--secondary btn--sm"
                onClick={() => openUrl('https://mc.163.com/dev/mcmanual/mc-dev/mcguide/introduction.html')}>
                📖 阅读文档
              </button>
            </div>
          </div>
        </div>

        {/* Dev Activity */}
        <div className="home-activity">
          <div className="home-activity__header">
            <span className="home-activity__title">开发动态</span>
            <div className="home-activity__actions">
              <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('create')}>
                📥 导入
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => onNavigate('create')}>
                ＋ 新建
              </button>
            </div>
          </div>

          {recentProjects.length === 0 ? (
            <div className="home-activity__empty">
              {/* Show announcements when no projects */}
              <div style={{ textAlign: 'left', width: '100%', maxWidth: 600, margin: '0 auto' }}>
                {ANNOUNCEMENTS.map((ann, i) => (
                  <div key={i} style={{
                    padding: '12px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'default'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {ann.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{ann.desc}</span>
                      <span style={{ flexShrink: 0, marginLeft: 12 }}>{ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="home-activity__list">
              {recentProjects.map(project => (
                <div key={project.id} className="home-activity__item" onClick={() => onNavigate('create')}>
                  <div className="home-activity__item-icon">
                    {project.type === 'addon' ? '📦' : project.type === 'map' ? '🗺️' : project.type === 'mod' ? '🔧' : '📄'}
                  </div>
                  <div className="home-activity__item-info">
                    <div className="home-activity__item-name">{project.name}</div>
                    <div className="home-activity__item-type">
                      {project.type === 'addon' ? '基岩版附加包'
                        : project.type === 'map' ? '基岩版地图'
                        : project.type === 'mod' ? 'Python Mod（ServerSystem/ClientSystem）'
                        : '基岩版皮肤'}
                    </div>
                  </div>
                  <div className="home-activity__item-extra">
                    <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onNavigate('push'); }}>开发测试</span>
                    <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onNavigate('manage'); }}>打包</span>
                  </div>
                  <div className="home-activity__item-date">
                    {new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN')} 修改
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Dev Tips */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '12px 20px', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>💡 开发小贴士</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            • 网易版 Mod 使用 <strong style={{ color: '#f59e0b' }}>Python 2.7</strong> 语法 — <code>print "hello"</code> 不是 <code>print("hello")</code><br/>
            • 打包必须包含 <strong style={{ color: '#3b82f6' }}>pack_manifest.json</strong>，否则报错码 10<br/>
            • 禁止中文路径！<code>behavior_pack/</code> 下必须有 <code>entities/</code> 目录（哪怕为空）<br/>
            • macOS 打包务必排除 <code>._*</code> 和 <code>__MACOSX</code> 幽灵文件
          </div>
        </div>
      </div>

      {/* Right: Quick Links Panel */}
      <div className="home-links">
        <div className="home-links__notice">
          <span style={{ color: '#3b82f6', cursor: 'pointer' }}
            onClick={() => openUrl('https://mc.163.com/dev/')}>
            📢 前往网易开发者平台查看最新公告
          </span>
        </div>

        {/* Big Icons Row */}
        <div className="home-links__top">
          {QUICK_LINKS.filter(l => l.size === 'lg').map((link, i) => (
            <div key={i} className="home-links__big-item" onClick={() => openUrl(link.url)}>
              <div className="home-links__big-icon" style={{ background: link.color }}>
                {link.icon}
              </div>
              <span>{link.label}</span>
            </div>
          ))}
        </div>

        {/* Grid Links */}
        <div className="home-links__grid">
          {QUICK_LINKS.filter(l => !l.size).map((link, i) => (
            <div
              key={i}
              className="home-links__grid-item"
              onClick={() => openUrl(link.url)}
              title={link.desc || link.label}
            >
              <span className="home-links__grid-icon">{link.icon}</span>
              <span>{link.label}</span>
            </div>
          ))}
        </div>

        {/* SDK Info Box */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>🧩 开发环境</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div>• Python: <strong>2.7.18</strong></div>
            <div>• 引擎版本: 基岩版 1.20+</div>
            <div>• SDK: <span style={{ color: '#3b82f6', cursor: 'pointer' }}
              onClick={() => openUrl('https://mc.163.com/dev/mcmanual/mc-dev/mcdocs/1-ModAPI/0-Intro.html')}>
              mod_sdk 补全库</span></div>
            <div>• 编辑器: VS Code + 补全库</div>
          </div>
        </div>
      </div>
    </div>
  );
}
