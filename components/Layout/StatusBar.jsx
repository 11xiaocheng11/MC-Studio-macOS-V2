import React from 'react';
import useProjectStore from '../../store/projectStore';

export default function StatusBar({ activeView }) {
  const currentProject = useProjectStore(s => s.currentProject);

  return (
    <div className="statusbar">
      <div className="statusbar__left">
        <div className="statusbar__indicator">
          <span className="statusbar__dot" />
          <span>就绪</span>
        </div>
        {currentProject && (
          <span>📁 {currentProject.name}</span>
        )}
      </div>
      <div className="statusbar__right">
        <span>{activeView || '项目管理'}</span>
        <span>MC Studio macOS v1.0.0</span>
      </div>
    </div>
  );
}
