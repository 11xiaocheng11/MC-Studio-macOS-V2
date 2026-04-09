import React, { useState, useEffect } from 'react';
import useProjectStore from '../../store/projectStore';
import CreateToolbar from './CreateToolbar';

export default function ProjectList({ addToast, onNavigate }) {
  const { projects, loadProjects, createProject, setCurrentProject, deleteProject, importProject } = useProjectStore();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('mod');
  const [newTemplate, setNewTemplate] = useState('basic-mod');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);
  const [modalTab, setModalTab] = useState('recommended');

  useEffect(() => { loadProjects(); }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by month
  const groupedProjects = {};
  filteredProjects.forEach(p => {
    const date = new Date(p.updatedAt || p.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
      ? '本月' : `${date.getFullYear()}年${date.getMonth() + 1}月`;
    if (!groupedProjects[key]) groupedProjects[key] = { label, projects: [] };
    groupedProjects[key].projects.push(p);
  });

  const handleCreate = async () => {
    if (!newName.trim()) { addToast('error', '请输入项目名称'); return; }
    const result = await createProject(newName.trim(), newType, newTemplate);
    if (result) {
      addToast('success', `项目「${newName}」创建成功！`);
      setShowNewModal(false);
      setNewName('');
    } else {
      addToast('error', '项目创建失败');
    }
  };

  const handleImport = async () => {
    if (!window.electronAPI) { addToast('error', '需要在 Electron 环境下运行'); return; }
    const filePath = await window.electronAPI.dialog.openFile({
      filters: [
        { name: 'Mod 文件', extensions: ['zip', 'mcaddon', 'mcpack'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (!filePath) return;
    setImporting(true);
    addToast('info', `正在导入 ${filePath.split('/').pop()}...`);
    const result = await importProject(filePath);
    setImporting(false);
    if (result?.error) {
      addToast('error', `导入失败: ${result.error}`);
    } else if (result) {
      addToast('success', `✅ 模组「${result.name}」导入成功！`);
      onNavigate('manage');
    }
  };

  const handleOpen = (project) => {
    setCurrentProject(project);
    addToast('info', `已打开项目「${project.name}」`);
    onNavigate('code');
  };

  const handleDelete = async (e, project) => {
    e.stopPropagation();
    if (confirm(`确定删除项目「${project.name}」？此操作不可撤销。`)) {
      await deleteProject(project.path);
      addToast('success', `项目「${project.name}」已删除`);
    }
  };

  const handleToolbarAction = (action) => {
    switch (action) {
      case 'new_addon':
        setNewType('addon');
        setShowNewModal(true);
        break;
      case 'new_server':
        addToast('info', '新建基岩版服务器 — 功能开发中');
        break;
      case 'import_addon':
      case 'import_server':
      case 'import_mod':
        handleImport();
        break;
      default:
        break;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <CreateToolbar onAction={handleToolbarAction} addToast={addToast} />

      {/* Body: Main + Right Panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <input
              className="input input--sm"
              placeholder="🔍 输入关键词搜索"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 240 }}
            />
          </div>

          {/* Projects */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
            {filteredProjects.length === 0 ? (
              <div className="works-page__empty" style={{ minHeight: 300 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⛏</div>
                <div>还没有项目</div>
                <div style={{ fontSize: 12, marginTop: 4, color: 'var(--text-muted)' }}>
                  点击上方工具栏新建组件或导入本地模组
                </div>
              </div>
            ) : (
              Object.entries(groupedProjects).sort((a, b) => b[0].localeCompare(a[0])).map(([key, group]) => (
                <div key={key}>
                  <div className="project-group-label">
                    {group.label} <span className="project-group-label__arrow">∧</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '8px 0 16px' }}>
                    {group.projects.map(project => (
                      <div key={project.id} className="works-project-card" onClick={() => handleOpen(project)}>
                        <div className="works-project-card__thumb">
                          <span style={{ fontSize: 36 }}>
                            {project.type === 'mod' ? '🔧' : project.type === 'addon' ? '📦' : '🗺️'}
                          </span>
                          <div className="works-project-card__badge">
                            {project.type === 'addon' ? '📦' : '🔧'}
                          </div>
                        </div>
                        <div className="works-project-card__info">
                          <div className="works-project-card__name">{project.name}</div>
                          <div className="works-project-card__meta">
                            <span>{project.type === 'mod' ? '模组' : project.type === 'addon' ? '附加包' : '地图'}</span>
                            <span>修改 {new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Test Records */}
        <div className="works-page__right">
          <div className="test-records">
            <div className="test-records__header">
              <span>测试存档记录</span>
              <div className="test-records__actions">
                <button className="btn btn--ghost btn--sm" style={{ padding: '2px 6px', fontSize: 11 }}>🗑️</button>
                <button className="btn btn--ghost btn--sm" style={{ padding: '2px 6px', fontSize: 11 }}>▶️</button>
              </div>
            </div>
            {projects.length > 0 ? (
              <div style={{ flex: 1, overflow: 'auto' }}>
                {projects.slice(0, 5).map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 4,
                      background: '#2a2b36',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}>📦</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11.5 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                        {new Date(p.updatedAt || p.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                    <button className="btn btn--ghost btn--sm" style={{ padding: '2px 4px', fontSize: 10 }}>▶</button>
                    <button className="btn btn--ghost btn--sm" style={{ padding: '2px 4px', fontSize: 10 }}>⋮</button>
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
        </div>
      </div>

      {/* New Project Modal — MC Studio Style */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 560 }}>
            <div className="modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📦</span>
                <span className="modal__title">新建基岩版组件</span>
              </div>
              <button className="modal__close" onClick={() => setShowNewModal(false)}>✕</button>
            </div>
            <div className="modal__body">
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
                <button
                  className={`works-page__tab ${modalTab === 'recommended' ? 'works-page__tab--active' : ''}`}
                  onClick={() => setModalTab('recommended')}
                  style={{ height: 36 }}
                >推荐</button>
                <button
                  className={`works-page__tab ${modalTab === 'legacy' ? 'works-page__tab--active' : ''}`}
                  onClick={() => setModalTab('legacy')}
                  style={{ height: 36 }}
                >旧版</button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', alignSelf: 'center' }}>
                  去内容库获取更多模板 &gt;
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                全新的预设架构编辑器功能强大，未来将得到持续的功能更新和问题修复，推荐使用。
              </div>

              {/* Template Category */}
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-primary)' }}>空白</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Blank Map */}
                <div
                  className="works-project-card"
                  onClick={() => { setNewType('map'); setNewTemplate('blank-map'); }}
                  style={{
                    width: 140,
                    border: newTemplate === 'blank-map' ? '2px solid #3b82f6' : undefined,
                  }}
                >
                  <div className="works-project-card__thumb" style={{ height: 100, background: '#2a2b36' }}>
                    <span style={{ fontSize: 40 }}>🗺️</span>
                  </div>
                  <div className="works-project-card__info">
                    <div className="works-project-card__name">空白地图</div>
                    <div className="works-project-card__meta">
                      <span>地图 · 空模板</span>
                    </div>
                  </div>
                </div>

                {/* Blank Addon */}
                <div
                  className="works-project-card"
                  onClick={() => { setNewType('addon'); setNewTemplate('blank-addon'); }}
                  style={{
                    width: 140,
                    border: newTemplate === 'blank-addon' ? '2px solid #3b82f6' : undefined,
                  }}
                >
                  <div className="works-project-card__thumb" style={{ height: 100, background: '#2a2b36' }}>
                    <span style={{ fontSize: 40 }}>📦</span>
                  </div>
                  <div className="works-project-card__info">
                    <div className="works-project-card__name">空白附加包</div>
                    <div className="works-project-card__meta">
                      <span>附加包 · 空模板</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div style={{ marginTop: 20 }}>
                <div className="input-group">
                  <label>项目名称</label>
                  <input
                    className="input"
                    placeholder="输入项目名称"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowNewModal(false)}>取消</button>
              <button className="btn btn--primary" onClick={handleCreate}>创建项目</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
