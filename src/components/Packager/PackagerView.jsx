import React, { useState, useCallback } from 'react';
import useProjectStore from '../../store/projectStore';
import { v4 as uuidv4 } from 'uuid';

// Helper: find manifest in behavior_pack or resource_pack (supports both naming conventions)
async function findManifestPath(basePath) {
  if (!window.electronAPI) return null;
  // Try pack_manifest.json first (NetEase standard), then manifest.json (Bedrock standard)
  for (const name of ['pack_manifest.json', 'manifest.json']) {
    const fullPath = `${basePath}/${name}`;
    const exists = await window.electronAPI.fs.exists(fullPath);
    if (exists) return { path: fullPath, name };
  }
  return null;
}

async function readManifest(basePath) {
  const found = await findManifestPath(basePath);
  if (!found) return null;
  const result = await window.electronAPI.fs.readFile(found.path);
  if (result.error) return null;
  try {
    return { ...JSON.parse(result.content), _path: found.path, _name: found.name };
  } catch { return null; }
}

const PRECHECK_RULES = [
  {
    id: 'manifest_bp',
    name: 'Behavior Pack Manifest',
    code: '10',
    description: 'behavior_pack 目录必须包含 pack_manifest.json 或 manifest.json',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      const manifest = {
        format_version: 1,
        header: { name: 'Auto-Generated', description: 'Auto-generated manifest', uuid: uuidv4(), version: [1, 0, 0] },
        modules: [{ description: 'behavior', type: 'data', uuid: uuidv4(), version: [1, 0, 0] }],
      };
      await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack`);
      await window.electronAPI.fs.writeFile(`${projectPath}/behavior_pack/pack_manifest.json`, JSON.stringify(manifest, null, 2));
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const found = await findManifestPath(`${projectPath}/behavior_pack`);
      if (found) {
        return { pass: true, detail: `使用 ${found.name}` };
      }
      return { pass: false, detail: '缺少 behavior_pack/pack_manifest.json 或 manifest.json' };
    },
  },
  {
    id: 'manifest_rp',
    name: 'Resource Pack Manifest',
    code: '10',
    description: 'resource_pack 目录必须包含 pack_manifest.json 或 manifest.json',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      const manifest = {
        format_version: 1,
        header: { name: 'Auto-Generated Resources', description: 'Auto-generated resource manifest', uuid: uuidv4(), version: [1, 0, 0] },
        modules: [{ description: 'resources', type: 'resources', uuid: uuidv4(), version: [1, 0, 0] }],
      };
      await window.electronAPI.fs.mkdir(`${projectPath}/resource_pack`);
      await window.electronAPI.fs.writeFile(`${projectPath}/resource_pack/pack_manifest.json`, JSON.stringify(manifest, null, 2));
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const found = await findManifestPath(`${projectPath}/resource_pack`);
      if (found) {
        return { pass: true, detail: `使用 ${found.name}` };
      }
      return { pass: false, detail: '缺少 resource_pack/pack_manifest.json 或 manifest.json' };
    },
  },
  {
    id: 'dir_textures',
    name: 'Textures 目录',
    code: '24',
    description: 'resource_pack 下必须有 textures/ 目录',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      await window.electronAPI.fs.mkdir(`${projectPath}/resource_pack/textures`);
      await window.electronAPI.fs.writeFile(
        `${projectPath}/resource_pack/textures/dummy.json`,
        JSON.stringify({ resource_pack_name: 'auto', texture_name: 'atlas.terrain' }, null, 2)
      );
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const exists = await window.electronAPI.fs.exists(`${projectPath}/resource_pack/textures`);
      return { pass: exists, detail: exists ? '' : '缺少 resource_pack/textures/' };
    },
  },
  {
    id: 'dir_entities',
    name: 'Entities 目录',
    code: '24',
    description: 'behavior_pack 下必须有 entities/ 目录',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack/entities`);
      await window.electronAPI.fs.writeFile(
        `${projectPath}/behavior_pack/entities/dummy.json`,
        JSON.stringify({ format_version: '1.12.0', 'minecraft:entity': { description: { identifier: 'mcstudio:dummy', is_spawnable: false, is_summonable: false } } }, null, 2)
      );
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const exists = await window.electronAPI.fs.exists(`${projectPath}/behavior_pack/entities`);
      return { pass: exists, detail: exists ? '' : '缺少 behavior_pack/entities/' };
    },
  },
  {
    id: 'no_chinese_path',
    name: '无中文路径',
    code: '—',
    description: '所有文件路径不得包含中文字符',
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const checkDir = async (dir) => {
        const entries = await window.electronAPI.fs.readDir(dir);
        if (entries.error) return [];
        const issues = [];
        for (const entry of entries) {
          if (/[\u4e00-\u9fa5]/.test(entry.name)) issues.push(entry.path);
          if (entry.isDirectory) issues.push(...await checkDir(entry.path));
        }
        return issues;
      };
      const issues = await checkDir(projectPath);
      return { pass: issues.length === 0, detail: issues.length > 0 ? `发现 ${issues.length} 个中文路径` : '' };
    },
  },
  {
    id: 'no_ghost_files',
    name: '无幽灵文件',
    code: '33/40',
    description: '不含 .DS_Store, ._*, __MACOSX, __pycache__',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      const ghostPatterns = ['.DS_Store', '__MACOSX', '__pycache__'];
      const cleanDir = async (dir) => {
        const entries = await window.electronAPI.fs.readDir(dir);
        if (entries.error) return;
        for (const entry of entries) {
          if (ghostPatterns.some(p => entry.name.includes(p)) || entry.name.startsWith('._')) {
            await window.electronAPI.fs.remove(entry.path);
          } else if (entry.isDirectory) {
            await cleanDir(entry.path);
          }
        }
      };
      await cleanDir(projectPath);
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const ghostPatterns = ['.DS_Store', '__MACOSX', '__pycache__'];
      const checkDir = async (dir) => {
        const entries = await window.electronAPI.fs.readDir(dir);
        if (entries.error) return [];
        const issues = [];
        for (const entry of entries) {
          if (ghostPatterns.some(p => entry.name.includes(p)) || entry.name.startsWith('._')) {
            issues.push(entry.path);
          }
          if (entry.isDirectory && !ghostPatterns.some(p => entry.name.includes(p))) {
            issues.push(...await checkDir(entry.path));
          }
        }
        return issues;
      };
      const issues = await checkDir(projectPath);
      return { pass: issues.length === 0, detail: issues.length > 0 ? `发现 ${issues.length} 个幽灵文件` : '' };
    },
  },
  {
    id: 'format_version',
    name: '引擎版本合规',
    code: '37',
    description: 'format_version 应为 1，彻底删除 min_engine_version（网易审核红线，错误码37）',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      // Fix both BP and RP manifests
      for (const pack of ['behavior_pack', 'resource_pack']) {
        const manifest = await readManifest(`${projectPath}/${pack}`);
        if (!manifest) continue;
        const fixed = { ...manifest };
        delete fixed._path;
        delete fixed._name;
        // 关键修复：format_version 必须为数字 1
        fixed.format_version = 1;
        // 关键修复：彻底删除所有层级的 min_engine_version
        if (fixed.header) delete fixed.header.min_engine_version;
        // 也清理 modules 中可能的 min_engine_version
        if (Array.isArray(fixed.modules)) {
          fixed.modules = fixed.modules.map(m => {
            const cleaned = { ...m };
            delete cleaned.min_engine_version;
            return cleaned;
          });
        }
        // 根级别也删除
        delete fixed.min_engine_version;
        await window.electronAPI.fs.writeFile(manifest._path, JSON.stringify(fixed, null, 2));
      }
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const issues = [];
      for (const pack of ['behavior_pack', 'resource_pack']) {
        const manifest = await readManifest(`${projectPath}/${pack}`);
        if (!manifest) { issues.push(`${pack}: 无法读取 manifest`); continue; }
        // 检查 format_version 必须为数字 1
        if (manifest.format_version !== 1) issues.push(`${pack}: format_version=${manifest.format_version}（需要为数字 1）`);
        // 检查所有层级的 min_engine_version
        if (manifest.header?.min_engine_version) issues.push(`${pack}: header 中包含 min_engine_version（网易禁止，错误码37）`);
        if (manifest.min_engine_version) issues.push(`${pack}: 根级别包含 min_engine_version（网易禁止）`);
        if (Array.isArray(manifest.modules)) {
          manifest.modules.forEach((m, i) => {
            if (m.min_engine_version) issues.push(`${pack}: modules[${i}] 包含 min_engine_version（网易禁止）`);
          });
        }
      }
      return {
        pass: issues.length === 0,
        detail: issues.join('; '),
      };
    },
  },
  {
    id: 'manifest_rename',
    name: 'Manifest 命名规范',
    code: '—',
    description: '网易要求使用 pack_manifest.json 而非 manifest.json',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      for (const pack of ['behavior_pack', 'resource_pack']) {
        const oldPath = `${projectPath}/${pack}/manifest.json`;
        const newPath = `${projectPath}/${pack}/pack_manifest.json`;
        const exists = await window.electronAPI.fs.exists(oldPath);
        const newExists = await window.electronAPI.fs.exists(newPath);
        if (exists && !newExists) {
          // Read, write to new name, delete old
          const content = await window.electronAPI.fs.readFile(oldPath);
          if (!content.error) {
            await window.electronAPI.fs.writeFile(newPath, content.content);
            await window.electronAPI.fs.remove(oldPath);
          }
        }
      }
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const issues = [];
      for (const pack of ['behavior_pack', 'resource_pack']) {
        const hasOld = await window.electronAPI.fs.exists(`${projectPath}/${pack}/manifest.json`);
        const hasNew = await window.electronAPI.fs.exists(`${projectPath}/${pack}/pack_manifest.json`);
        if (hasOld && !hasNew) issues.push(`${pack} 使用 manifest.json（应为 pack_manifest.json）`);
      }
      return {
        pass: issues.length === 0,
        detail: issues.join('; '),
      };
    },
  },
  {
    id: 'mod_info',
    name: 'mod.info 配置',
    code: '—',
    description: '网易模组需要 mod.info 入口文件（Python Mod 类型）',
    fixable: true,
    fix: async (projectPath) => {
      if (!window.electronAPI) return;
      let projectName = 'MyMod';
      try {
        const configResult = await window.electronAPI.fs.readFile(`${projectPath}/project.json`);
        if (configResult.content) {
          const config = JSON.parse(configResult.content);
          projectName = config.name || 'MyMod';
        }
      } catch {}
      // Also try from behavior_pack manifest
      const bpManifest = await readManifest(`${projectPath}/behavior_pack`);
      if (bpManifest?.header?.name) projectName = bpManifest.header.name.replace(/ (BP|netease_suffix)/g, '');

      const modInfo = JSON.stringify({
        netease_mod: {
          name: projectName,
          description: `${projectName} - 由 MC Studio macOS 创建`,
          author: 'MCStudio-macOS',
          version: '1.0.0',
          entry: 'scripts/modMain.py',
        },
      }, null, 2);
      await window.electronAPI.fs.writeFile(`${projectPath}/behavior_pack/mod.info`, modInfo);
    },
    check: async (projectPath) => {
      if (!window.electronAPI) return { pass: true };
      const exists = await window.electronAPI.fs.exists(`${projectPath}/behavior_pack/mod.info`);
      return { pass: exists, detail: exists ? '' : '缺少 behavior_pack/mod.info（Python Mod 需要）' };
    },
  },
];

export default function PackagerView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const [checkResults, setCheckResults] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [packageResult, setPackageResult] = useState(null);
  const [activeTab, setActiveTab] = useState('precheck');
  const [generatedUUIDs, setGeneratedUUIDs] = useState([]);
  const [modInfoContent, setModInfoContent] = useState('');

  const runPreCheck = async () => {
    if (!currentProject) { addToast('error', '请先打开一个项目'); return; }
    setIsChecking(true);
    setCheckResults([]);
    const results = [];
    for (const rule of PRECHECK_RULES) {
      const result = await rule.check(currentProject.path);
      results.push({ ...rule, ...result });
      setCheckResults([...results]);
    }
    setIsChecking(false);
    const passCount = results.filter(r => r.pass).length;
    if (passCount === results.length) {
      addToast('success', `全部 ${passCount} 项检查通过！可以打包`);
    } else {
      addToast('warning', `${results.length - passCount} 项检查未通过`);
    }
  };

  const handleAutoFix = async () => {
    if (!currentProject) return;
    setIsFixing(true);
    const failedFixable = checkResults.filter(r => !r.pass && r.fixable);
    let fixedCount = 0;
    for (const rule of failedFixable) {
      try {
        await rule.fix(currentProject.path);
        fixedCount++;
      } catch (err) {
        console.error(`Fix failed for ${rule.id}:`, err);
      }
    }
    setIsFixing(false);
    addToast('success', `已自动修复 ${fixedCount} 项问题，重新运行预检验证...`);
    setTimeout(runPreCheck, 500);
  };

  const handlePackageAs = async (format) => {
    if (!currentProject) { addToast('error', '请先打开一个项目'); return; }
    setIsPackaging(true);
    setPackageResult(null);
    try {
      const ext = format === '7z' ? '7z' : format === 'zip' ? 'zip' : 'mcaddon';
      const outputPath = `${currentProject.path}/../${currentProject.name}.${ext}`;
      if (window.electronAPI) {
        let result;
        if (format === '7z') {
          // Use package:create7z IPC for 7z format
          result = await window.electronAPI.package.create7z(currentProject.path, outputPath);
        } else {
          // Both .mcaddon and .zip use the same zip archiver
          result = await window.electronAPI.package.create(currentProject.path, outputPath);
        }
        if (result.success) {
          setPackageResult({ success: true, path: outputPath, size: result.size, format: ext });
          addToast('success', `打包 .${ext} 成功！大小: ${(result.size / 1024).toFixed(1)} KB`);
        } else {
          setPackageResult({ success: false, error: result.error });
          addToast('error', `打包失败: ${result.error}`);
        }
      }
    } catch (err) {
      addToast('error', `打包异常: ${err.message}`);
    }
    setIsPackaging(false);
  };

  const handlePackage = () => handlePackageAs('mcaddon');
  const handlePackageZip = () => handlePackageAs('zip');
  const handlePackage7z = () => handlePackageAs('7z');

  const generateUUID = () => {
    const newId = uuidv4();
    setGeneratedUUIDs(prev => [{ id: newId, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      addToast('success', '已复制到剪贴板');
    });
  };

  const loadModInfo = useCallback(async () => {
    if (!currentProject) return;
    const modInfoPath = `${currentProject.path}/behavior_pack/mod.info`;
    if (window.electronAPI) {
      const result = await window.electronAPI.fs.readFile(modInfoPath);
      if (result.content) {
        setModInfoContent(result.content);
      } else {
        // Auto-detect name from manifest
        let name = currentProject.name;
        const manifest = await readManifest(`${currentProject.path}/behavior_pack`);
        if (manifest?.header?.name) name = manifest.header.name.replace(/ (BP|netease_suffix)/g, '');

        setModInfoContent(JSON.stringify({
          netease_mod: {
            name,
            description: `${name} - 由 MC Studio macOS 创建`,
            author: 'MCStudio-macOS',
            version: '1.0.0',
            entry: 'scripts/modMain.py',
          },
        }, null, 2));
      }
    }
  }, [currentProject]);

  const saveModInfo = async () => {
    if (!currentProject) return;
    try {
      JSON.parse(modInfoContent);
      await window.electronAPI.fs.writeFile(`${currentProject.path}/behavior_pack/mod.info`, modInfoContent);
      addToast('success', 'mod.info 已保存');
    } catch (err) {
      addToast('error', `JSON 格式错误: ${err.message}`);
    }
  };

  const failedCount = checkResults.filter(r => !r.pass).length;
  const fixableCount = checkResults.filter(r => !r.pass && r.fixable).length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-header__title">📦 打包 & 预检</h1>
        <div className="page-header__actions">
          <button className="btn btn--secondary" onClick={runPreCheck} disabled={isChecking}>
            {isChecking ? '⏳ 检查中...' : '🔍 运行预检'}
          </button>
          {failedCount > 0 && fixableCount > 0 && (
            <button className="btn btn--warning" onClick={handleAutoFix} disabled={isFixing} style={{
              background: 'linear-gradient(135deg, #ff9100, #ff6d00)',
              border: 'none', color: '#fff',
            }}>
              {isFixing ? '⏳ 修复中...' : `🔧 一键修复 (${fixableCount})`}
            </button>
          )}
          <button className="btn btn--primary" onClick={handlePackage} disabled={isPackaging} style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', color: '#fff',
          }}>
            {isPackaging ? '⏳ 打包中...' : '📦 一键打包 .mcaddon'}
          </button>
          <button className="btn btn--primary" onClick={handlePackageZip} disabled={isPackaging} style={{
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            border: 'none', color: '#fff',
          }}>
            {isPackaging ? '⏳ 打包中...' : '📦 一键打包 .zip'}
          </button>
          <button className="btn btn--primary" onClick={handlePackage7z} disabled={isPackaging} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none', color: '#fff',
          }}>
            {isPackaging ? '⏳ 打包中...' : '📦 一键打包 .7z'}
          </button>
        </div>
      </div>

      {/* Tool Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'precheck', label: '🔍 预检结果', count: checkResults.length > 0 ? `${checkResults.filter(r => r.pass).length}/${checkResults.length}` : null },
          { id: 'uuid', label: '🔑 UUID 工具' },
          { id: 'modinfo', label: '📋 mod.info 编辑' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn--ghost btn--sm`}
            onClick={() => { setActiveTab(tab.id); if (tab.id === 'modinfo') loadModInfo(); }}
            style={{
              padding: '10px 16px',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
              borderRadius: 0,
              fontSize: 12,
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
            }}
          >
            {tab.label} {tab.count && <span className="tag tag--addon" style={{ marginLeft: 6, fontSize: 9 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {!currentProject ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ fontSize: 64 }}>📦</div>
            <div className="empty-state__title">NO PROJECT</div>
            <div className="empty-state__desc">请先在项目管理中打开一个项目</div>
          </div>
        ) : activeTab === 'precheck' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Project Info */}
            <div className="card" style={{ cursor: 'default' }}>
              <div className="card__header">
                <div className="card__icon">📁</div>
                <div>
                  <div className="card__title">{currentProject.name}</div>
                  <div className="card__subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {currentProject.path}
                  </div>
                </div>
              </div>
            </div>

            {/* PreCheck Results */}
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 12 }}>
                PRE-CHECK RESULTS ({checkResults.filter(r => r.pass).length}/{checkResults.length})
              </div>
              <div className="check-list">
                {checkResults.length === 0 && !isChecking && (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                    点击「运行预检」开始检查
                  </div>
                )}
                {checkResults.map(result => (
                  <div key={result.id} className={`check-item ${result.pass ? 'check-item--pass' : 'check-item--fail'}`}>
                    <div className={`check-item__icon ${result.pass ? 'check-item__icon--pass' : 'check-item__icon--fail'}`}>
                      {result.pass ? '✓' : '✕'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="check-item__text">{result.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{result.description}</div>
                    </div>
                    <div className="check-item__detail" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {result.code !== '—' && <span className="tag tag--addon">错误码 {result.code}</span>}
                      {result.detail && <span style={{ color: result.pass ? 'var(--color-success)' : 'var(--color-error)', fontSize: 11 }}>{result.detail}</span>}
                      {!result.pass && result.fixable && (
                        <span className="tag" style={{ background: 'rgba(255,145,0,0.2)', color: '#ff9100', fontSize: 9 }}>可修复</span>
                      )}
                    </div>
                  </div>
                ))}
                {isChecking && (
                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <div className="progress" style={{ maxWidth: 300, margin: '0 auto' }}>
                      <div className="progress__bar" style={{ width: `${(checkResults.length / PRECHECK_RULES.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Package Result */}
            {packageResult && (
              <div className="card" style={{ cursor: 'default', borderColor: packageResult.success ? 'rgba(0,230,118,0.3)' : 'rgba(255,23,68,0.3)' }}>
                <div className="card__header">
                  <div className="card__icon" style={{ background: packageResult.success ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {packageResult.success ? '✓' : '✕'}
                  </div>
                  <div>
                    <div className="card__title">{packageResult.success ? '打包成功！' : '打包失败'}</div>
                    <div className="card__subtitle">
                      {packageResult.success
                        ? `输出: ${packageResult.path} (${(packageResult.size / 1024).toFixed(1)} KB)`
                        : packageResult.error}
                    </div>
                  </div>
                </div>
                {packageResult.success && (
                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => {
                      if (window.electronAPI) window.electronAPI.shell.showItemInFolder(packageResult.path);
                    }}>
                      📂 在 Finder 中显示
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'uuid' ? (
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 16 }}>
              UUID GENERATOR
            </div>
            <div style={{ marginBottom: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              网易版 Minecraft Mod 要求每个包和模块都有唯一的 UUID。使用此工具快速生成符合标准的 UUID v4。
            </div>
            <button className="btn btn--primary" onClick={generateUUID} style={{ marginBottom: 20 }}>
              🎲 生成新 UUID
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {generatedUUIDs.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: i === 0 ? 'rgba(0,210,255,0.08)' : 'var(--bg-primary)',
                  border: `1px solid ${i === 0 ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.3s',
                }}>
                  <code style={{
                    flex: 1, fontFamily: 'var(--font-mono)', fontSize: 13,
                    color: i === 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    letterSpacing: 0.5,
                  }}>
                    {item.id}
                  </code>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.time}</span>
                  <button className="btn btn--ghost btn--sm" onClick={() => copyToClipboard(item.id)} style={{ padding: '4px 8px', fontSize: 11 }}>
                    📋 复制
                  </button>
                </div>
              ))}
              {generatedUUIDs.length === 0 && (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  点击上方按钮生成 UUID
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'modinfo' ? (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--accent-primary)', marginBottom: 16 }}>
              MOD.INFO EDITOR
            </div>
            <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <code>mod.info</code> 是网易版 Python Mod 的入口配置文件，定义了模组名称、版本、入口脚本等信息。
              编辑后点击保存将写入 <code>behavior_pack/mod.info</code>。
            </div>
            <textarea
              className="input"
              value={modInfoContent}
              onChange={e => setModInfoContent(e.target.value)}
              style={{
                width: '100%', height: 300,
                fontFamily: 'var(--font-mono)', fontSize: 13,
                lineHeight: 1.7, resize: 'vertical',
                background: 'var(--bg-primary)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
              }}
              spellCheck={false}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn--primary" onClick={saveModInfo}>💾 保存 mod.info</button>
              <button className="btn btn--secondary" onClick={loadModInfo}>🔄 重新加载</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
