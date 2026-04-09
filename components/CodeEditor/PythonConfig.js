/**
 * Python 2.7 + NetEase Mod SDK AutoComplete Definitions
 */
export function getPythonCompletions(monaco, range) {
  return [
    // === Server API ===
    { label: 'import mod.server.extraServerApi as serverApi', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'import mod.server.extraServerApi as serverApi', range, detail: '导入服务端API' },
    { label: 'import mod.client.extraClientApi as clientApi', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'import mod.client.extraClientApi as clientApi', range, detail: '导入客户端API' },
    
    // Server System
    { label: 'serverApi.GetServerSystemCls', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.GetServerSystemCls()', range, detail: '获取服务端系统基类' },
    { label: 'serverApi.RegisterSystem', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.RegisterSystem("${1:namespace}", "${2:name}", "${3:clsPath}")', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '注册服务端系统' },
    { label: 'serverApi.CreateComponent', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.CreateComponent(${1:entityId}, "${2:namespace}", "${3:name}")', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建服务端组件' },
    { label: 'serverApi.GetEngineCompFactory', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.GetEngineCompFactory()', range, detail: '获取引擎组件工厂' },
    { label: 'serverApi.GetEngineNamespace', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.GetEngineNamespace()', range, detail: '获取引擎命名空间' },
    { label: 'serverApi.GetEngineSystemName', kind: monaco.languages.CompletionItemKind.Function, insertText: 'serverApi.GetEngineSystemName()', range, detail: '获取引擎系统名' },

    // Client System
    { label: 'clientApi.GetClientSystemCls', kind: monaco.languages.CompletionItemKind.Function, insertText: 'clientApi.GetClientSystemCls()', range, detail: '获取客户端系统基类' },
    { label: 'clientApi.RegisterSystem', kind: monaco.languages.CompletionItemKind.Function, insertText: 'clientApi.RegisterSystem("${1:namespace}", "${2:name}", "${3:clsPath}")', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '注册客户端系统' },
    { label: 'clientApi.CreateComponent', kind: monaco.languages.CompletionItemKind.Function, insertText: 'clientApi.CreateComponent(${1:entityId}, "${2:namespace}", "${3:name}")', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建客户端组件' },
    { label: 'clientApi.GetEngineCompFactory', kind: monaco.languages.CompletionItemKind.Function, insertText: 'clientApi.GetEngineCompFactory()', range, detail: '获取客户端引擎组件工厂' },

    // Events
    { label: 'self.ListenForEvent', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.ListenForEvent(${1:namespace}, ${2:systemName}, "${3:eventName}", self, self.${4:callback})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '监听事件' },
    { label: 'self.UnListenForEvent', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.UnListenForEvent(${1:namespace}, ${2:systemName}, "${3:eventName}", self, self.${4:callback})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '取消监听事件' },
    { label: 'self.NotifyToServer', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.NotifyToServer("${1:eventName}", ${2:data})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '通知服务端' },
    { label: 'self.NotifyToClient', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.NotifyToClient(${1:playerId}, "${2:eventName}", ${3:data})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '通知客户端' },
    { label: 'self.CreateEventData', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.CreateEventData()', range, detail: '创建事件数据' },
    { label: 'self.UnListenAllEvents', kind: monaco.languages.CompletionItemKind.Method, insertText: 'self.UnListenAllEvents()', range, detail: '取消所有事件监听' },

    // Common Events
    { label: 'AddServerPlayerEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"AddServerPlayerEvent"', range, detail: '玩家加入服务端事件' },
    { label: 'DelServerPlayerEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"DelServerPlayerEvent"', range, detail: '玩家离开服务端事件' },
    { label: 'ServerChatEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"ServerChatEvent"', range, detail: '服务端聊天事件' },
    { label: 'PlayerDieEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"PlayerDieEvent"', range, detail: '玩家死亡事件' },
    { label: 'PlayerRespawnEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"PlayerRespawnEvent"', range, detail: '玩家重生事件' },
    { label: 'EntityRemoveEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"EntityRemoveEvent"', range, detail: '实体移除事件' },
    { label: 'ServerBlockUseEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"ServerBlockUseEvent"', range, detail: '方块使用事件' },
    { label: 'ServerItemUseEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"ServerItemUseEvent"', range, detail: '物品使用事件' },
    { label: 'DamageEvent', kind: monaco.languages.CompletionItemKind.Event, insertText: '"DamageEvent"', range, detail: '伤害事件' },
    { label: 'UiInitFinished', kind: monaco.languages.CompletionItemKind.Event, insertText: '"UiInitFinished"', range, detail: 'UI初始化完成事件' },

    // Components
    { label: 'compFactory.CreatePos', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreatePos(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建位置组件' },
    { label: 'compFactory.CreateRot', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateRot(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建旋转组件' },
    { label: 'compFactory.CreateAttr', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateAttr(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建属性组件' },
    { label: 'compFactory.CreateItem', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateItem(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建物品组件' },
    { label: 'compFactory.CreateBlockInfo', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateBlockInfo(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建方块信息组件' },
    { label: 'compFactory.CreateCommand', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateCommand(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建命令组件' },
    { label: 'compFactory.CreateMsg', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateMsg(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建消息组件' },
    { label: 'compFactory.CreateGame', kind: monaco.languages.CompletionItemKind.Method, insertText: 'compFactory.CreateGame(${1:entityId})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, detail: '创建游戏组件' },

    // === Snippets ===
    {
      label: 'modmain-template',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: [
        '# -*- coding: utf-8 -*-',
        'import mod.server.extraServerApi as serverApi',
        'import mod.client.extraClientApi as clientApi',
        '',
        'MOD_NAMESPACE = "${1:MyMod}"',
        '',
        'def register():',
        '    serverApi.RegisterSystem(MOD_NAMESPACE, "${2:MainServer}", "scripts.server.${2:MainServer}.${2:MainServer}")',
        '    clientApi.RegisterSystem(MOD_NAMESPACE, "${3:MainClient}", "scripts.client.${3:MainClient}.${3:MainClient}")',
        '',
        'register()',
      ].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail: 'modMain.py 完整模板',
    },
    {
      label: 'server-system-template',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: [
        '# -*- coding: utf-8 -*-',
        'import mod.server.extraServerApi as serverApi',
        '',
        'ServerSystem = serverApi.GetServerSystemCls()',
        '',
        'class ${1:MyServerSystem}(ServerSystem):',
        '    def __init__(self, namespace, systemName):',
        '        ServerSystem.__init__(self, namespace, systemName)',
        '        self._initEvents()',
        '',
        '    def _initEvents(self):',
        '        self.ListenForEvent(serverApi.Engine, serverApi.Engine, "${2:AddServerPlayerEvent}", self, self.${3:OnEvent})',
        '',
        '    def ${3:OnEvent}(self, args):',
        '        ${4:pass}',
        '',
        '    def Destroy(self):',
        '        self.UnListenAllEvents()',
      ].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail: 'ServerSystem 完整模板',
    },
    {
      label: 'client-system-template',
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: [
        '# -*- coding: utf-8 -*-',
        'import mod.client.extraClientApi as clientApi',
        '',
        'ClientSystem = clientApi.GetClientSystemCls()',
        '',
        'class ${1:MyClientSystem}(ClientSystem):',
        '    def __init__(self, namespace, systemName):',
        '        ClientSystem.__init__(self, namespace, systemName)',
        '        self._initEvents()',
        '',
        '    def _initEvents(self):',
        '        self.ListenForEvent(clientApi.Engine, clientApi.Engine, "${2:UiInitFinished}", self, self.${3:OnEvent})',
        '',
        '    def ${3:OnEvent}(self, args):',
        '        ${4:pass}',
        '',
        '    def Destroy(self):',
        '        self.UnListenAllEvents()',
      ].join('\n'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail: 'ClientSystem 完整模板',
    },
  ];
}
