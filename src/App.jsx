import React, { useState, useEffect, useCallback } from 'react';
import Titlebar from './components/Layout/Titlebar';
import Sidebar from './components/Layout/Sidebar';
import StatusBar from './components/Layout/StatusBar';
import HomeView from './components/Home/HomeView';
import ProjectList from './components/ProjectManager/ProjectList';
import CodeEditorView from './components/CodeEditor/CodeEditorView';
import JsonEditorView from './components/JsonEditor/JsonEditorView';
import MapEditorView from './components/MapEditor/MapEditorView';
import LogicEditorView from './components/LogicEditor/LogicEditorView';
import PackagerView from './components/Packager/PackagerView';
import PushTestView from './components/PushTest/PushTestView';
import WineManagerView from './components/WineManager/WineManagerView';
import ModrinthBrowser from './components/ModBrowser/ModrinthBrowser';
import WorksBedrockAddon from './components/Works/WorksBedrockAddon';
import WorksBedrockServer from './components/Works/WorksBedrockServer';
import WorksJavaAddon from './components/Works/WorksJavaAddon';
import WorksJavaServer from './components/Works/WorksJavaServer';
import ToastContainer from './components/Common/ToastContainer';
import useProjectStore from './store/projectStore';

const VIEW_LABELS = {
  home: '首页',
  create: '创作',
  works_bedrock_addon: '基岩版组件',
  works_bedrock_server: '基岩版服务器',
  works_java_addon: 'Java版组件',
  works_java_server: 'Java版服务器',
  content: '内容库',
  manage: '发布与管理',
  code: '代码编辑',
  json: 'JSON 编辑',
  map: '地图编辑',
  logic: '逻辑编辑',
  push: '推送测试',
  wine: 'Wine/GPTK',
};

export default function App() {
  const [activeView, setActiveView] = useState('home');
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => {
    // Read persisted theme or default to 'dark'
    try { return localStorage.getItem('mc-studio-theme') || 'dark'; } catch { return 'dark'; }
  });
  const { setProjectsDir, loadProjects } = useProjectStore();

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('mc-studio-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    const init = async () => {
      if (window.electronAPI) {
        const home = await window.electronAPI.app.getPath('home');
        setProjectsDir(`${home}/MCStudio-Projects`);
        await loadProjects();
      } else {
        setProjectsDir('/tmp/MCStudio-Projects');
      }
    };
    init();
  }, []);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HomeView addToast={addToast} onNavigate={setActiveView} />;
      case 'create': return <ProjectList addToast={addToast} onNavigate={setActiveView} />;
      case 'works_bedrock_addon': return <WorksBedrockAddon addToast={addToast} onNavigate={setActiveView} />;
      case 'works_bedrock_server': return <WorksBedrockServer addToast={addToast} onNavigate={setActiveView} />;
      case 'works_java_addon': return <WorksJavaAddon addToast={addToast} onNavigate={setActiveView} />;
      case 'works_java_server': return <WorksJavaServer addToast={addToast} onNavigate={setActiveView} />;
      case 'content': return <ModrinthBrowser addToast={addToast} />;
      case 'manage': return <PackagerView addToast={addToast} />;
      case 'code': return <CodeEditorView addToast={addToast} />;
      case 'json': return <JsonEditorView addToast={addToast} />;
      case 'map': return <MapEditorView addToast={addToast} />;
      case 'logic': return <LogicEditorView addToast={addToast} />;
      case 'push': return <PushTestView addToast={addToast} />;
      case 'wine': return <WineManagerView addToast={addToast} />;
      default: return <HomeView addToast={addToast} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="app-container">
      <Titlebar />
      <div className="app-body">
        <Sidebar activeView={activeView} onViewChange={setActiveView} theme={theme} onToggleTheme={toggleTheme} />
        <div className="app-content">
          <div className="app-main">{renderView()}</div>
        </div>
      </div>
      <StatusBar activeView={VIEW_LABELS[activeView] || '首页'} />
      <ToastContainer toasts={toasts} />
    </div>
  );
}
