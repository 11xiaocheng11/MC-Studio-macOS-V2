import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  projectsDir: null,

  setProjectsDir: (dir) => set({ projectsDir: dir }),

  loadProjects: async () => {
    const dir = get().projectsDir;
    if (!dir || !window.electronAPI) return;
    
    try {
      const exists = await window.electronAPI.fs.exists(dir);
      if (!exists) {
        await window.electronAPI.fs.mkdir(dir);
      }

      const entries = await window.electronAPI.fs.readDir(dir);
      if (entries.error) return;

      const projects = [];
      for (const entry of entries) {
        if (!entry.isDirectory) continue;
        const configPath = `${entry.path}/project.json`;
        const configExists = await window.electronAPI.fs.exists(configPath);
        if (configExists) {
          const result = await window.electronAPI.fs.readFile(configPath);
          if (result.content) {
            try {
              const config = JSON.parse(result.content);
              projects.push({ ...config, path: entry.path });
            } catch (e) {
              console.error('Failed to parse project config:', e);
            }
          }
        }
      }
      set({ projects });
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  },

  createProject: async (name, type, template) => {
    const dir = get().projectsDir;
    if (!dir) return null;

    const projectId = uuidv4();
    const projectPath = `${dir}/${name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    
    const config = {
      id: projectId,
      name,
      type,
      template,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    try {
      // Create directory structure
      await window.electronAPI.fs.mkdir(projectPath);
      
      if (type === 'addon' || type === 'mod') {
        // behavior_pack
        await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack`);
        await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack/entities`);
        await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack/scripts`);
        
        // resource_pack
        await window.electronAPI.fs.mkdir(`${projectPath}/resource_pack`);
        await window.electronAPI.fs.mkdir(`${projectPath}/resource_pack/textures`);
        await window.electronAPI.fs.mkdir(`${projectPath}/resource_pack/models`);

        // Manifests
        const bpUUID = uuidv4();
        const rpUUID = uuidv4();
        const bpModuleUUID = uuidv4();
        const rpModuleUUID = uuidv4();

        const bpManifest = {
          format_version: 1,
          header: {
            name: name,
            description: `${name} - Behavior Pack`,
            uuid: bpUUID,
            version: [1, 0, 0],
          },
          modules: [{
            description: `${name} behavior`,
            type: 'data',
            uuid: bpModuleUUID,
            version: [1, 0, 0],
          }],
        };

        const rpManifest = {
          format_version: 1,
          header: {
            name: name,
            description: `${name} - Resource Pack`,
            uuid: rpUUID,
            version: [1, 0, 0],
          },
          modules: [{
            description: `${name} resources`,
            type: 'resources',
            uuid: rpModuleUUID,
            version: [1, 0, 0],
          }],
        };

        await window.electronAPI.fs.writeFile(
          `${projectPath}/behavior_pack/pack_manifest.json`,
          JSON.stringify(bpManifest, null, 2)
        );
        await window.electronAPI.fs.writeFile(
          `${projectPath}/resource_pack/pack_manifest.json`,
          JSON.stringify(rpManifest, null, 2)
        );

        // Dummy files for validation (error code 24)
        await window.electronAPI.fs.writeFile(
          `${projectPath}/behavior_pack/entities/dummy.json`,
          JSON.stringify({ format_version: "1.12.0", "minecraft:entity": { description: { identifier: "mcstudio:dummy", is_spawnable: false, is_summonable: false } } }, null, 2)
        );
        await window.electronAPI.fs.writeFile(
          `${projectPath}/resource_pack/textures/dummy.json`,
          JSON.stringify({ resource_pack_name: name, texture_name: "atlas.terrain" }, null, 2)
        );

        // Template files
        if (type === 'mod' || template === 'basic-mod' || template === 'advanced-mod') {
          const modMain = `# -*- coding: utf-8 -*-
import mod.server.extraServerApi as serverApi
import mod.client.extraClientApi as clientApi

# Mod 入口文件
# MC Studio macOS 自动生成

MOD_NAMESPACE = "${name.replace(/[^a-zA-Z0-9]/g, '')}"
MOD_NAME = "${name}"
MOD_VERSION = "1.0.0"

def register():
    """注册所有 System"""
    serverApi.RegisterSystem(MOD_NAMESPACE, "MainServerSystem", "scripts.server.MainServerSystem.MainServerSystem")
    clientApi.RegisterSystem(MOD_NAMESPACE, "MainClientSystem", "scripts.client.MainClientSystem.MainClientSystem")

register()
`;
          await window.electronAPI.fs.writeFile(`${projectPath}/behavior_pack/scripts/modMain.py`, modMain);

          // Server System
          await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack/scripts/server`);
          const serverSys = `# -*- coding: utf-8 -*-
import mod.server.extraServerApi as serverApi

ServerSystem = serverApi.GetServerSystemCls()

class MainServerSystem(ServerSystem):
    """服务端主系统"""
    
    def __init__(self, namespace, systemName):
        ServerSystem.__init__(self, namespace, systemName)
        print "MainServerSystem initialized"
        self._initEvents()
    
    def _initEvents(self):
        """初始化事件监听"""
        self.ListenForEvent(serverApi.Engine, serverApi.Engine, "AddServerPlayerEvent", self, self.OnPlayerJoin)
        self.ListenForEvent(serverApi.Engine, serverApi.Engine, "ServerChatEvent", self, self.OnChat)
    
    def OnPlayerJoin(self, args):
        """玩家加入事件"""
        playerId = args.get("id", "")
        print "Player joined: %s" % playerId
    
    def OnChat(self, args):
        """聊天事件"""
        message = args.get("message", "")
        playerId = args.get("playerId", "")
        print "Chat from %s: %s" % (playerId, message)
    
    def Destroy(self):
        """系统销毁时清理"""
        self.UnListenAllEvents()
`;
          await window.electronAPI.fs.writeFile(`${projectPath}/behavior_pack/scripts/server/MainServerSystem.py`, serverSys);

          // Client System
          await window.electronAPI.fs.mkdir(`${projectPath}/behavior_pack/scripts/client`);
          const clientSys = `# -*- coding: utf-8 -*-
import mod.client.extraClientApi as clientApi

ClientSystem = clientApi.GetClientSystemCls()

class MainClientSystem(ClientSystem):
    """客户端主系统"""
    
    def __init__(self, namespace, systemName):
        ClientSystem.__init__(self, namespace, systemName)
        print "MainClientSystem initialized"
        self._initEvents()
    
    def _initEvents(self):
        """初始化事件监听"""
        self.ListenForEvent(clientApi.Engine, clientApi.Engine, "UiInitFinished", self, self.OnUIInit)
    
    def OnUIInit(self, args):
        """UI 初始化完成"""
        print "UI initialized"
    
    def Destroy(self):
        """系统销毁时清理"""
        self.UnListenAllEvents()
`;
          await window.electronAPI.fs.writeFile(`${projectPath}/behavior_pack/scripts/client/MainClientSystem.py`, clientSys);
        }
      }

      // Save project config
      await window.electronAPI.fs.writeFile(
        `${projectPath}/project.json`,
        JSON.stringify(config, null, 2)
      );

      // Reload projects
      await get().loadProjects();
      return config;
    } catch (err) {
      console.error('Failed to create project:', err);
      return null;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),

  importProject: async (zipPath) => {
    const dir = get().projectsDir;
    if (!dir || !window.electronAPI) return null;
    
    try {
      const result = await window.electronAPI.project.importZip(zipPath, dir);
      if (result.error) {
        console.error('Import failed:', result.error);
        return { error: result.error };
      }
      
      // Reload projects
      await get().loadProjects();
      
      // Auto-select the imported project
      set({ currentProject: result.config });
      
      return result.config;
    } catch (err) {
      console.error('Import error:', err);
      return { error: err.message };
    }
  },

  deleteProject: async (projectPath) => {
    try {
      await window.electronAPI.fs.remove(projectPath);
      await get().loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  },
}));

export default useProjectStore;
