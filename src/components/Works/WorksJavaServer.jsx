import React, { useState } from 'react';

const FILTER_STAGES = ['全部', '开发阶段', '审核阶段', '上线阶段'];

export default function WorksJavaServer({ addToast }) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('全部');

  return (
    <div className="works-page">
      <div className="works-page__header">
        <div className="works-page__tabs">
          <button className="works-page__tab works-page__tab--active">线上网络服</button>
          <button className="works-page__tab" onClick={() => addToast('info', '离线网络服管理 — 功能开发中')}>离线网络服</button>
        </div>
        <div className="works-page__header-actions">
          <button className="btn btn--ghost btn--sm" onClick={() => addToast('info', '刷新列表 — 需要连接开发者平台')}>🔄 刷新</button>
        </div>
      </div>
      <div className="works-page__body">
        <div className="works-page__content">
          <div className="works-page__filters">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>审核阶段:</span>
              {FILTER_STAGES.map(s => (
                <button
                  key={s}
                  className={`works-page__stage-btn ${stage === s ? 'works-page__stage-btn--active' : ''}`}
                  onClick={() => setStage(s)}
                >
                  {s}
                </button>
              ))}
              <input className="input input--sm" placeholder="🔍 按作品名称搜索" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200, marginLeft: 'auto' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>◄ 1/1 ►</span>
            </div>
          </div>
          <div className="works-page__empty">
            <div>尚无 Java 版网络游戏</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Java 版网络服需要在开发者平台申请资格后创建</div>
            <div style={{ fontSize: 11, marginTop: 16, color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: 400, textAlign: 'left' }}>
              <strong>📋 Java 版网络服说明：</strong><br/>
              • Java 版网络服基于 NMS/Bukkit 核心运行<br/>
              • 需要在开发者平台完成资质审核<br/>
              • 支持自定义插件和 Mod 扩展<br/>
              • 服务器端口需在 server.properties 中配置<br/>
              • 配置错误参考错误码 1001-1003
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
