import React, { useState, useRef, useEffect } from 'react';

const TOOLBAR_GROUPS = [
  {
    id: 'new_addon',
    icon: '📦',
    label: '新建基岩版组件',
    color: '#3b82f6',
    action: 'new_addon',
    hasPlus: true,
  },
  {
    id: 'new_server',
    icon: '🖥️',
    label: '新建基岩版服务器',
    color: '#3b82f6',
    action: 'new_server',
    hasPlus: true,
  },
  {
    id: 'import',
    icon: '📥',
    label: '本地导入',
    color: '#f59e0b',
    hasDropdown: true,
    items: [
      { id: 'import_addon', icon: '📦', label: '导入基岩版组件（.mcaddon/.mcpack/.zip）', action: 'import_addon' },
      { id: 'import_server', icon: '🌐', label: '导入基岩版网络服（zip 包）', action: 'import_server' },
      { id: 'import_mod', icon: '🔧', label: '导入服务器 Mod（Python 脚本包）', action: 'import_mod' },
    ],
  },
  {
    id: 'diag',
    icon: '📊',
    label: '性能诊断',
    color: '#f59e0b',
    hasDropdown: true,
    items: [
      { id: 'diag_probe', label: '方块探针', desc: '查看方块属性、位置和元数据' },
      { id: 'diag_detect', label: '方块易测', desc: '快速检测方块放置和销毁事件' },
      { id: 'diag_cpu', label: 'CPU 使用分析工具', desc: '分析 Mod 脚本 CPU 消耗' },
      { id: 'diag_mem', label: '内存分析工具', desc: '检测内存泄漏和对象引用' },
      { id: 'diag_perf', label: '性能监测工具', desc: 'FPS / TPS / 实体数实时面板' },
    ],
  },
  {
    id: 'toolbox',
    icon: '🧰',
    label: '工具箱',
    color: '#22c55e',
    hasDropdown: true,
    items: [
      { id: 'tool_log', label: '日志与测试工具', desc: '查看 print 日志和 SDK 日志输出', action: 'open_log' },
      { id: 'tool_script', label: '脚本测试日志', desc: 'Python 脚本运行异常捕获' },
      { id: 'tool_modpc', label: 'Mod PC 开发包', desc: 'mod_sdk 代码补全库下载', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcguide/18-newcomer_guide/0-dev_env_setup.html' },
      { id: 'tool_mobile', label: '手机测试版启动器', desc: '推送 Addon 到移动设备' },
      { id: 'tool_model', label: '原版模型转换工具', desc: '将 Java 版模型转换为基岩版格式' },
      { id: 'tool_texture', label: '贴图压缩工具 (beta)', desc: '批量压缩 textures/ 目录下的 PNG 文件' },
      { id: 'tool_stable', label: '安装 3.7 stable 补全库', desc: 'Python 2.7 stable 分支的 mod_sdk', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcdocs/1-ModAPI/0-Intro.html' },
      { id: 'tool_beta', label: '安装 3.8 beta 补全库', desc: '最新 beta 分支的 mod_sdk', url: 'https://mc.163.com/dev/mcmanual/mc-dev/mcdocs/1-ModAPI/0-Intro.html' },
    ],
  },
];

export default function CreateToolbar({ onAction, addToast }) {
  const [openDropdown, setOpenDropdown] = useState(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openUrl = (url) => {
    if (window.electronAPI?.shell?.openExternal) {
      window.electronAPI.shell.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleClick = (group) => {
    if (group.hasDropdown) {
      setOpenDropdown(openDropdown === group.id ? null : group.id);
    } else if (group.action) {
      onAction(group.action);
      setOpenDropdown(null);
    }
  };

  const handleItemClick = (item) => {
    if (item.url) {
      openUrl(item.url);
    } else if (item.action) {
      onAction(item.action);
    } else {
      addToast('info', `${item.label} — ${item.desc || '功能开发中'}`);
    }
    setOpenDropdown(null);
  };

  return (
    <div className="create-toolbar" ref={toolbarRef}>
      {TOOLBAR_GROUPS.map(group => (
        <div key={group.id} className="create-toolbar__group">
          <button
            className="create-toolbar__btn"
            style={{ '--btn-color': group.color }}
            onClick={() => handleClick(group)}
          >
            <span className="create-toolbar__btn-icon">{group.icon}</span>
            <span className="create-toolbar__btn-label">{group.label}</span>
            {group.hasPlus && <span className="create-toolbar__btn-plus">＋</span>}
            {group.hasDropdown && (
              <span className={`create-toolbar__btn-arrow ${openDropdown === group.id ? 'create-toolbar__btn-arrow--open' : ''}`}>
                ▾
              </span>
            )}
          </button>

          {/* Dropdown */}
          {group.hasDropdown && openDropdown === group.id && (
            <div className="create-toolbar__dropdown">
              {group.items.map(item => (
                <div
                  key={item.id}
                  className="create-toolbar__dropdown-item"
                  onClick={() => handleItemClick(item)}
                  title={item.desc || ''}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <div style={{ flex: 1 }}>
                    <div>{item.label}</div>
                    {item.desc && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>}
                  </div>
                  {item.url && <span className="create-toolbar__dropdown-dl">🔗</span>}
                  {item.action && !item.url && <span className="create-toolbar__dropdown-dl">⬇</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
