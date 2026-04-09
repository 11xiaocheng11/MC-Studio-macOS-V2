import React, { useState } from 'react';

const TABS = ['网络服开发', '插件', '线上网络服', '第三方网络服'];
const STAGES = ['开发阶段', '审核阶段', '上线阶段'];

const TAB_EMPTY = {
  '网络服开发': { text: '尚无正在开发的网络服', sub: '请从新建作品中新建网络服，或者本地导入网络服资源文件' },
  '插件': { text: '尚无服务器插件', sub: '服务器插件基于 Python 2.7 开发，通过 ServerSystem 注册到引擎' },
  '线上网络服': { text: '尚无线上网络服', sub: '提交审核通过后将在此处显示已上线的网络服' },
  '第三方网络服': { text: '尚无第三方网络服', sub: '第三方网络服需要在开发者平台申请接入资格' },
};

export default function WorksBedrockServer({ addToast, onNavigate }) {
  const [activeTab, setActiveTab] = useState('网络服开发');
  const [activeStage, setActiveStage] = useState('开发阶段');
  const [search, setSearch] = useState('');

  const emptyState = TAB_EMPTY[activeTab] || TAB_EMPTY['网络服开发'];

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
          <button className="btn btn--secondary btn--sm" onClick={() => addToast('info', '性能诊断 — 服务器端支持 CPU 分析和性能监测')}>📊 性能诊断</button>
          <button className="btn btn--secondary btn--sm" onClick={() => addToast('info', '工具箱 — 日志工具 / 脚本测试日志 / Mod PC开发包')}>🧰 工具箱</button>
          <button className="btn btn--primary btn--sm" onClick={() => onNavigate('create')}>＋ 新建</button>
          <button className="btn btn--secondary btn--sm" onClick={() => onNavigate('create')}>📥 本地导入</button>
        </div>
      </div>
      <div className="works-page__body">
        <div className="works-page__content">
          <div className="works-page__filters">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>网络服阶段:</span>
              {STAGES.map(s => (
                <button key={s} className={`works-page__stage-btn ${activeStage === s ? 'works-page__stage-btn--active' : ''}`} onClick={() => setActiveStage(s)}>
                  {s}
                </button>
              ))}
              <input className="input input--sm" placeholder="🔍 输入关键词搜索" value={search} onChange={e => setSearch(e.target.value)} style={{ marginLeft: 'auto', width: 200 }} />
            </div>
            <div className="works-page__filter-row">
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>分类标签: ✔️ 标签单选</span>
              <button className="btn btn--ghost btn--sm">管理</button>
            </div>
            <div className="works-page__tag-filters">
              <button className="works-page__tag-btn works-page__tag-btn--active">全部</button>
              <button className="works-page__tag-btn">未分类</button>
            </div>
          </div>
          <div className="works-page__empty">
            <div>{emptyState.text}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>{emptyState.sub}</div>
            {activeTab === '插件' && (
              <div style={{ fontSize: 11, marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 400, textAlign: 'left' }}>
                <strong>🐍 服务器插件开发规范：</strong><br/>
                • 入口文件: modMain.py（RegisterSystem 注册引擎）<br/>
                • ServerSystem — 服务端逻辑（世界规则、实体交互）<br/>
                • ClientSystem — 客户端逻辑（UI、粒子特效）<br/>
                • 事件通信: ListenForEvent / NotifyToServer / NotifyToClient<br/>
                • 组件接口: serverApi.CreateComponent() / clientApi.CreateComponent()
              </div>
            )}
          </div>
        </div>
        <div className="works-page__right">
          <div className="test-records">
            <div className="test-records__header">
              <span>测试存档记录</span>
              <div className="test-records__actions">
                <button className="btn btn--ghost btn--sm" title="清空记录">🗑️</button>
                <button className="btn btn--ghost btn--sm" title="启动测试">▶️</button>
              </div>
            </div>
            <div className="test-records__empty">此作品暂无测试记录<br/>请移动鼠标至作品后<br/>点击开发测试</div>
          </div>
          {/* Server Dev Notes */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 12, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>📌 服务器须知</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              • server.properties 配置<br/>
              • 错误码 1001-1003: JSON 格式<br/>
              • 错误码 2001-2002: 资源加载<br/>
              • 错误码 3001: Python 语法<br/>
              • 错误码 5001: SDK 断言
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
