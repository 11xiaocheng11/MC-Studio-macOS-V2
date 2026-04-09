import React, { useState } from 'react';
import useProjectStore from '../../store/projectStore';

const TABS = ['游戏地图', '联机地图', '附加包', '其他作品', '云端列表', '联机测试'];

const TAB_DESCRIPTIONS = {
  '游戏地图': '单机玩法地图，包含冒险、建筑、解谜等类型',
  '联机地图': '支持多人同时游玩的联机地图资源',
  '附加包': '行为包 + 资源包组合的附加内容（Addon）',
  '其他作品': '皮肤包、材质包等其他可上传的作品类型',
  '云端列表': '已上传至网易开发者平台的线上作品',
  '联机测试': '正在进行联机调试的测试存档',
};

const TAB_EMPTY = {
  '游戏地图': { text: '尚无基岩版游戏地图作品', sub: '请使用新建作品创建，或者本地导入功能进行作品导入' },
  '联机地图': { text: '尚无联机地图作品', sub: '联机地图需要在开发者平台创建后同步' },
  '附加包':   { text: '尚无基岩版附加包', sub: '附加包包含 behavior_pack 和 resource_pack，请确保结构完整' },
  '其他作品': { text: '尚无其他类型作品', sub: '支持皮肤包、材质包等资源的管理' },
  '云端列表': { text: '尚无已上传的作品', sub: '打包完成后前往「发布与管理」进行打包上传' },
  '联机测试': { text: '尚无联机测试存档', sub: '请先创建作品后开始联机调试' },
};

export default function WorksBedrockAddon({ addToast, onNavigate }) {
  const [activeTab, setActiveTab] = useState('游戏地图');
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('全部');
  const projects = useProjectStore(s => s.projects);
  const setCurrentProject = useProjectStore(s => s.setCurrentProject);

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    // Filter by tab
    if (activeTab === '附加包') return matchSearch && p.type === 'addon';
    if (activeTab === '游戏地图') return matchSearch && (p.type === 'map' || p.type === 'mod');
    return matchSearch;
  });

  const emptyState = TAB_EMPTY[activeTab] || TAB_EMPTY['游戏地图'];

  return (
    <div className="works-page">
      {/* Top Tabs */}
      <div className="works-page__header">
        <div className="works-page__tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`works-page__tab ${activeTab === tab ? 'works-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
              title={TAB_DESCRIPTIONS[tab]}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="works-page__header-actions">
          <button className="btn btn--secondary btn--sm" onClick={() => addToast('info', '性能诊断 — 可在创作页工具栏中使用（方块探针 / CPU分析 / 内存分析）')}>📊 性能诊断</button>
          <button className="btn btn--secondary btn--sm" onClick={() => addToast('info', '工具箱 — 可在创作页工具栏中使用（日志工具 / 补全库安装 / 模型转换）')}>🧰 工具箱</button>
          <button className="btn btn--primary btn--sm" onClick={() => onNavigate('create')}>＋ 新建</button>
          <button className="btn btn--secondary btn--sm" onClick={() => onNavigate('create')}>📥 本地导入</button>
        </div>
      </div>

      <div className="works-page__body">
        {/* Main Content */}
        <div className="works-page__content">
          {/* Search + Filters */}
          <div className="works-page__filters">
            <input
              className="input input--sm works-page__search"
              placeholder="🔍 按作品名称搜索"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="works-page__filter-row">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>分类标签: ✔️ 标签单选</span>
              <button className="btn btn--ghost btn--sm">管理</button>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8, cursor: 'pointer' }}
                onClick={() => addToast('info', '批量删除 — 请先选择作品')}>批量删除</span>
            </div>
            <div className="works-page__tag-filters">
              {['全部', '未分类'].map(tag => (
                <button
                  key={tag}
                  className={`works-page__tag-btn ${filterTag === tag ? 'works-page__tag-btn--active' : ''}`}
                  onClick={() => setFilterTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Project List / Empty */}
          {filteredProjects.length === 0 ? (
            <div className="works-page__empty">
              <div>{emptyState.text}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{emptyState.sub}</div>
              {activeTab === '附加包' && (
                <div style={{ fontSize: 11, marginTop: 12, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 360, textAlign: 'left' }}>
                  <strong>📋 附加包结构要求：</strong><br/>
                  behavior_pack/ → pack_manifest.json + entities/ + scripts/<br/>
                  resource_pack/ → pack_manifest.json + textures/<br/>
                  ⚠️ 根目录禁止出现 __pycache__ 或中文路径
                </div>
              )}
            </div>
          ) : (
            <div className="works-page__grid">
              {filteredProjects.map(project => (
                <div key={project.id} className="works-project-card" onClick={() => {
                  setCurrentProject(project);
                  onNavigate('code');
                }}>
                  <div className="works-project-card__thumb">
                    <span style={{ fontSize: 32 }}>
                      {project.type === 'addon' ? '📦' : project.type === 'mod' ? '🔧' : '🗺️'}
                    </span>
                    <div className="works-project-card__badge">
                      {project.type === 'addon' ? '📦' : project.type === 'mod' ? '🐍' : '🗺️'}
                    </div>
                  </div>
                  <div className="works-project-card__info">
                    <div className="works-project-card__name">{project.name}</div>
                    <div className="works-project-card__meta">
                      <span>{project.type === 'addon' ? '附加包' : project.type === 'mod' ? 'Python Mod' : '地图'} · v{project.version || '1.0.0'}</span>
                      <span>修改 {new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Test Records */}
        <div className="works-page__right">
          <div className="test-records">
            <div className="test-records__header">
              <span>测试存档记录</span>
              <div className="test-records__actions">
                <button className="btn btn--ghost btn--sm" title="清空所有记录">🗑️</button>
                <button className="btn btn--ghost btn--sm" title="启动测试">▶️</button>
              </div>
            </div>
            {filteredProjects.length > 0 ? (
              <div style={{ padding: 12 }}>
                {filteredProjects.slice(0, 3).map((p, i) => (
                  <div key={i} style={{
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    fontSize: 11,
                    color: 'var(--text-muted)',
                  }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{p.name}</div>
                    <div style={{ marginTop: 2 }}>上次测试: {new Date(p.updatedAt || p.createdAt).toLocaleDateString('zh-CN')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="test-records__empty">
                此作品暂无测试记录<br/>
                请移动鼠标至作品后<br/>
                点击开发测试
              </div>
            )}
          </div>

          {/* Dev Notes */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>📌 开发须知</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              • Python 2.7 语法<br/>
              • pack_manifest.json 必配<br/>
              • entities/ 目录必须存在<br/>
              • 禁止中文路径
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
