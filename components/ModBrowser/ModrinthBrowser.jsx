import React, { useState, useEffect, useCallback, useRef } from 'react';
import { searchMods, getProject, getVersions, formatDownloads, formatDate, downloadModFile, installModToMC } from '../../store/modrinthApi';

const SORT_OPTIONS = [
  { value: 'relevance', label: '相关度' },
  { value: 'downloads', label: '下载量' },
  { value: 'follows', label: '关注数' },
  { value: 'newest', label: '最新' },
  { value: 'updated', label: '最近更新' },
];

const PROJECT_TYPES = [
  { value: 'mod', label: '模组' },
  { value: 'resourcepack', label: '资源包' },
  { value: 'datapack', label: '数据包' },
  { value: 'shader', label: '光影' },
];

export default function ModrinthBrowser({ addToast }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [projectType, setProjectType] = useState('mod');
  const [page, setPage] = useState(0);
  const [selectedMod, setSelectedMod] = useState(null);
  const [modDetail, setModDetail] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [installed, setInstalled] = useState(new Set());
  const searchRef = useRef(null);
  const LIMIT = 20;

  // 初始加载热门模组
  useEffect(() => {
    doSearch('');
  }, []);

  const doSearch = useCallback(async (searchQuery, resetPage = true, pageOverride = null) => {
    setLoading(true);
    const targetPage = resetPage ? 0 : (pageOverride ?? page);
    if (resetPage) setPage(0);
    try {
      const result = await searchMods(searchQuery, {
        limit: LIMIT,
        offset: targetPage * LIMIT,
        index: sortBy,
        projectType,
      });
      setResults(result.hits);
      setTotal(result.total);
    } catch (err) {
      addToast('error', `搜索失败: ${err.message}`);
    }
    setLoading(false);
  }, [sortBy, projectType, page, addToast]);

  const handleSearch = (e) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setTimeout(() => doSearch(query), 0);
  };

  const handleTypeChange = (newType) => {
    setProjectType(newType);
    setTimeout(() => doSearch(query), 0);
  };

  const openModDetail = async (mod) => {
    setSelectedMod(mod);
    setLoadingDetail(true);
    try {
      const [detail, versionList] = await Promise.all([
        getProject(mod.slug || mod.project_id),
        getVersions(mod.slug || mod.project_id),
      ]);
      setModDetail(detail);
      setVersions(versionList);
    } catch (err) {
      addToast('error', `获取详情失败: ${err.message}`);
    }
    setLoadingDetail(false);
  };

  const closeDetail = () => {
    setSelectedMod(null);
    setModDetail(null);
    setVersions([]);
  };

  const handleDownload = async (version) => {
    if (!version.files || version.files.length === 0) {
      addToast('error', '该版本没有可下载的文件');
      return;
    }

    const file = version.files.find(f => f.primary) || version.files[0];
    const downloadId = version.id;
    setDownloading(downloadId);

    try {
      if (window.electronAPI) {
        // 下载到本地
        const home = await window.electronAPI.app.getPath('home');
        const destDir = `${home}/MCStudio-Downloads`;
        await window.electronAPI.fs.mkdir(destDir);
        const destPath = `${destDir}/${file.filename}`;

        const result = await window.electronAPI.mod.download(file.url, destPath);
        if (result.success) {
          addToast('success', `✅ 下载完成: ${file.filename}`);

          // 自动安装到 Wine MC
          const installResult = await window.electronAPI.mod.install(destPath);
          if (installResult.success) {
            addToast('success', `📦 已安装到 MC: ${file.filename}`);
            setInstalled(prev => new Set([...prev, downloadId]));
          } else {
            addToast('warning', `下载成功但安装失败: ${installResult.error || '请手动安装'}`);
          }
        } else {
          addToast('error', `下载失败: ${result.error}`);
        }
      } else {
        // 浏览器模式 - 打开下载链接
        window.open(file.url, '_blank');
        addToast('info', '已在浏览器中打开下载链接');
        setInstalled(prev => new Set([...prev, downloadId]));
      }
    } catch (err) {
      addToast('error', `操作失败: ${err.message}`);
    }

    setDownloading(null);
  };

  const loadMoreResults = () => {
    const newPage = page + 1;
    setPage(newPage);
    doSearch(query, false, newPage);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="page-header glass-header">
        <h1 className="page-header__title">🔍 Modrinth 模组商店</h1>
        <div className="page-header__actions">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {total > 0 ? `${total.toLocaleString()} 个结果` : ''}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            ref={searchRef}
            className="input"
            placeholder="搜索模组... 如 appleskin, optifine, jei..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? '⏳' : '🔍'} 搜索
          </button>
        </form>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Project type */}
          <div style={{ display: 'flex', gap: 4 }}>
            {PROJECT_TYPES.map(t => (
              <button
                key={t.value}
                className={`btn btn--sm ${projectType === t.value ? 'btn--primary' : 'btn--ghost'}`}
                onClick={() => handleTypeChange(t.value)}
                style={{ fontSize: 11 }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="divider" style={{ width: 1, height: 20, margin: 0 }} />

          {/* Sort */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>排序:</span>
            {SORT_OPTIONS.map(s => (
              <button
                key={s.value}
                className={`btn btn--sm ${sortBy === s.value ? 'btn--secondary' : 'btn--ghost'}`}
                onClick={() => handleSortChange(s.value)}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
        {/* Results List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {loading && results.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 100 }} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div className="empty-state__title">未找到模组</div>
              <div className="empty-state__desc">尝试不同的关键词或过滤条件</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {results.map(mod => (
                <div
                  key={mod.project_id}
                  className="card hover-lift"
                  style={{
                    padding: 16,
                    cursor: 'pointer',
                    borderColor: selectedMod?.project_id === mod.project_id ? 'var(--accent-primary)' : undefined,
                  }}
                  onClick={() => openModDetail(mod)}
                >
                  <div style={{ display: 'flex', gap: 14 }}>
                    {/* Icon */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)', flexShrink: 0,
                      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {mod.icon_url ? (
                        <img src={mod.icon_url} alt={mod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 28 }}>📦</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{mod.title}</span>
                        {mod.categories && mod.categories.slice(0, 3).map(cat => (
                          <span key={cat} className="tag tag--addon" style={{ fontSize: 9 }}>{cat}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                        {mod.description?.slice(0, 120)}{mod.description?.length > 120 ? '...' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>⬇ {formatDownloads(mod.downloads)}</span>
                        <span>❤ {formatDownloads(mod.follows)}</span>
                        <span>📅 {formatDate(mod.date_modified)}</span>
                        <span>by {mod.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load more */}
              {results.length < total && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <button className="btn btn--secondary" onClick={loadMoreResults} disabled={loading}>
                    {loading ? '加载中...' : `加载更多 (${results.length}/${total})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedMod && (
          <div style={{
            width: 420, borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflow: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {loadingDetail ? (
              <div style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 200, marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 20, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '80%' }} />
              </div>
            ) : modDetail ? (
              <>
                {/* Detail header */}
                <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', flexShrink: 0, background: 'var(--bg-primary)',
                      }}>
                        {modDetail.icon_url ? (
                          <img src={modDetail.icon_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <span style={{ fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</span>}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{modDetail.title}</h3>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{modDetail.description}</div>
                      </div>
                    </div>
                    <button className="btn btn--ghost btn--sm" onClick={closeDetail} style={{ padding: 4 }}>✕</button>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>⬇ {formatDownloads(modDetail.downloads)} 下载</span>
                    <span>❤ {formatDownloads(modDetail.followers)} 关注</span>
                  </div>

                  {/* Categories */}
                  {modDetail.categories && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                      {modDetail.categories.map(cat => (
                        <span key={cat} className="tag tag--addon">{cat}</span>
                      ))}
                    </div>
                  )}

                  {/* Loaders */}
                  {modDetail.loaders && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {modDetail.loaders.map(loader => (
                        <span key={loader} className="tag tag--mod">{loader}</span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <a
                      href={`https://modrinth.com/mod/${modDetail.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--ghost btn--sm"
                      style={{ fontSize: 11, textDecoration: 'none' }}
                    >
                      🌐 Modrinth 页面
                    </a>
                    {modDetail.source_url && (
                      <a href={modDetail.source_url} target="_blank" rel="noopener noreferrer"
                        className="btn btn--ghost btn--sm" style={{ fontSize: 11, textDecoration: 'none' }}>
                        📂 源代码
                      </a>
                    )}
                  </div>
                </div>

                {/* Versions */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                    VERSIONS ({versions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {versions.slice(0, 20).map(ver => {
                      const file = ver.files?.find(f => f.primary) || ver.files?.[0];
                      const isDownloading = downloading === ver.id;
                      const isInstalled = installed.has(ver.id);

                      return (
                        <div key={ver.id} style={{
                          padding: '10px 12px', background: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${isInstalled ? 'rgba(0,230,118,0.3)' : 'rgba(255,255,255,0.04)'}`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{ver.name || ver.version_number}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                {ver.game_versions?.slice(0, 3).join(', ')}
                                {ver.loaders?.length > 0 && ` · ${ver.loaders.join(', ')}`}
                              </div>
                              {file && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                  {file.filename} ({(file.size / 1024).toFixed(0)} KB)
                                </div>
                              )}
                            </div>
                            <button
                              className={`btn btn--sm ${isInstalled ? 'btn--secondary' : 'btn--primary'}`}
                              onClick={(e) => { e.stopPropagation(); handleDownload(ver); }}
                              disabled={isDownloading}
                              style={{ fontSize: 10, minWidth: 72 }}
                            >
                              {isDownloading ? (
                                <><span className="spinner spinner--sm" style={{ marginRight: 4 }} /> 下载中</>
                              ) : isInstalled ? (
                                '✓ 已安装'
                              ) : (
                                '⬇ 安装'
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
