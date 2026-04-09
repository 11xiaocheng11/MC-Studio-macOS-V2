/**
 * Mod SDK Node Definitions + Python 2.7 Code Generator
 * 覆盖 40+ 常用 API 节点
 */

export const MOD_SDK_NODES = [
  // === EVENT NODES ===
  { id: 'evt_player_join', type: 'event', label: '玩家加入', description: 'AddServerPlayerEvent', outputs: ['playerId'], category: 'server' },
  { id: 'evt_player_leave', type: 'event', label: '玩家离开', description: 'DelServerPlayerEvent', outputs: ['playerId'], category: 'server' },
  { id: 'evt_player_die', type: 'event', label: '玩家死亡', description: 'PlayerDieEvent', outputs: ['playerId', 'attackerId'], category: 'server' },
  { id: 'evt_player_respawn', type: 'event', label: '玩家重生', description: 'PlayerRespawnEvent', outputs: ['playerId'], category: 'server' },
  { id: 'evt_chat', type: 'event', label: '聊天消息', description: 'ServerChatEvent', outputs: ['playerId', 'message'], category: 'server' },
  { id: 'evt_block_use', type: 'event', label: '使用方块', description: 'ServerBlockUseEvent', outputs: ['playerId', 'blockName', 'x', 'y', 'z'], category: 'server' },
  { id: 'evt_item_use', type: 'event', label: '使用物品', description: 'ServerItemUseEvent', outputs: ['playerId', 'itemName'], category: 'server' },
  { id: 'evt_damage', type: 'event', label: '伤害事件', description: 'DamageEvent', outputs: ['entityId', 'attackerId', 'damage'], category: 'server' },
  { id: 'evt_entity_remove', type: 'event', label: '实体移除', description: 'EntityRemoveEvent', outputs: ['entityId'], category: 'server' },
  { id: 'evt_tick', type: 'event', label: '每Tick执行', description: 'OnScriptTickServer', outputs: [], category: 'server' },
  { id: 'evt_ui_init', type: 'event', label: 'UI初始化', description: 'UiInitFinished', outputs: [], category: 'client' },
  { id: 'evt_player_attack', type: 'event', label: '玩家攻击', description: 'PlayerAttackEntityEvent', outputs: ['playerId', 'victimId'], category: 'server' },

  // === ACTION NODES ===
  { id: 'act_send_msg', type: 'action', label: '发送消息', description: '向玩家发送消息', params: [{ name: 'playerId', default: 'playerId' }, { name: '消息内容', default: 'Hello!' }] },
  { id: 'act_run_command', type: 'action', label: '执行命令', description: '执行 MC 命令', params: [{ name: '命令', default: '/say Hello' }] },
  { id: 'act_teleport', type: 'action', label: '传送玩家', description: '传送到指定坐标', params: [{ name: 'playerId', default: 'playerId' }, { name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }] },
  { id: 'act_spawn_entity', type: 'action', label: '生成实体', description: '在指定位置生成实体', params: [{ name: '实体ID', default: 'minecraft:zombie' }, { name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }] },
  { id: 'act_set_block', type: 'action', label: '放置方块', description: '在指定位置放置方块', params: [{ name: '方块ID', default: 'minecraft:stone' }, { name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }] },
  { id: 'act_set_health', type: 'action', label: '设置生命值', description: '设置实体生命值', params: [{ name: 'entityId', default: 'entityId' }, { name: '生命值', default: '20' }] },
  { id: 'act_add_item', type: 'action', label: '给予物品', description: '给玩家物品', params: [{ name: 'playerId', default: 'playerId' }, { name: '物品ID', default: 'minecraft:diamond' }, { name: '数量', default: '1' }] },
  { id: 'act_clear_item', type: 'action', label: '清除物品', description: '清除玩家背包物品', params: [{ name: 'playerId', default: 'playerId' }, { name: '物品ID', default: 'minecraft:dirt' }] },
  { id: 'act_set_attr', type: 'action', label: '设置属性', description: '设置实体属性值', params: [{ name: 'entityId', default: 'entityId' }, { name: '属性', default: 'speed' }, { name: '值', default: '0.3' }] },
  { id: 'act_play_sound', type: 'action', label: '播放音效', description: '播放音效', params: [{ name: '音效名', default: 'mob.zombie.say' }, { name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }] },
  { id: 'act_add_effect', type: 'action', label: '添加效果', description: '添加药水效果', params: [{ name: 'entityId', default: 'entityId' }, { name: '效果ID', default: '1' }, { name: '持续秒', default: '30' }, { name: '等级', default: '1' }] },
  { id: 'act_remove_entity', type: 'action', label: '移除实体', description: '移除实体', params: [{ name: 'entityId', default: 'entityId' }] },
  { id: 'act_explosion', type: 'action', label: '爆炸', description: '在指定位置产生爆炸', params: [{ name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }, { name: '威力', default: '3' }] },
  { id: 'act_notify_client', type: 'action', label: '通知客户端', description: '发送事件到客户端', params: [{ name: 'playerId', default: 'playerId' }, { name: '事件名', default: 'CustomEvent' }] },
  { id: 'act_print', type: 'action', label: '输出日志', description: 'print 输出调试信息', params: [{ name: '内容', default: 'Debug info' }] },

  // === CONDITION NODES ===
  { id: 'cond_compare', type: 'condition', label: '值比较', description: '比较两个值', params: [{ name: '左值', default: 'a' }, { name: '运算符', default: '==' }, { name: '右值', default: 'b' }] },
  { id: 'cond_has_item', type: 'condition', label: '拥有物品', description: '检查玩家是否拥有物品', params: [{ name: 'playerId', default: 'playerId' }, { name: '物品ID', default: 'minecraft:diamond' }] },
  { id: 'cond_in_range', type: 'condition', label: '在范围内', description: '检查坐标是否在范围内', params: [{ name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }, { name: '半径', default: '10' }] },
  { id: 'cond_is_player', type: 'condition', label: '是否玩家', description: '检查实体是否为玩家', params: [{ name: 'entityId', default: 'entityId' }] },
  { id: 'cond_health_check', type: 'condition', label: '生命值判断', description: '检查生命值条件', params: [{ name: 'entityId', default: 'entityId' }, { name: '运算符', default: '<' }, { name: '阈值', default: '5' }] },
  { id: 'cond_block_is', type: 'condition', label: '方块类型判断', description: '检查方块是否为指定类型', params: [{ name: 'x', default: '0' }, { name: 'y', default: '64' }, { name: 'z', default: '0' }, { name: '方块ID', default: 'minecraft:stone' }] },
  { id: 'cond_random', type: 'condition', label: '随机条件', description: '以一定概率触发', params: [{ name: '概率%', default: '50' }] },

  // === VARIABLE NODES ===
  { id: 'var_set', type: 'variable', label: '设置变量', description: '设置变量值', params: [{ name: '变量名', default: 'myVar' }, { name: '值', default: '0' }] },
  { id: 'var_get', type: 'variable', label: '获取变量', description: '获取变量值', params: [{ name: '变量名', default: 'myVar' }] },
  { id: 'var_add', type: 'variable', label: '变量加法', description: '变量值增加', params: [{ name: '变量名', default: 'myVar' }, { name: '增量', default: '1' }] },
  { id: 'var_get_pos', type: 'variable', label: '获取位置', description: '获取实体位置', params: [{ name: 'entityId', default: 'entityId' }] },
  { id: 'var_get_name', type: 'variable', label: '获取名称', description: '获取玩家名称', params: [{ name: 'playerId', default: 'playerId' }] },
  { id: 'var_timer', type: 'variable', label: '计时器', description: '延迟执行', params: [{ name: '延迟Tick', default: '20' }] },
  { id: 'var_list_op', type: 'variable', label: '列表操作', description: '列表增删查', params: [{ name: '列表名', default: 'myList' }, { name: '操作', default: 'add' }, { name: '值', default: '' }] },
];

/**
 * Generate Python 2.7 code from React Flow nodes and edges
 */
export function generatePythonCode(nodes, edges) {
  const eventNodes = nodes.filter(n => n.type === 'event');
  const actionNodes = nodes.filter(n => n.type === 'action');

  // Build adjacency list
  const adj = {};
  edges.forEach(e => {
    if (!adj[e.source]) adj[e.source] = [];
    adj[e.source].push(e.target);
  });

  // Generate event handler code
  const handlers = [];
  const registrations = [];

  eventNodes.forEach(eventNode => {
    const sdkDef = MOD_SDK_NODES.find(n => n.id === eventNode.data.sdkId);
    if (!sdkDef) return;

    const handlerName = `On_${sdkDef.description.replace(/Event$/, '')}`;
    const eventName = sdkDef.description;

    registrations.push(
      `        self.ListenForEvent(serverApi.Engine, serverApi.Engine, "${eventName}", self, self.${handlerName})`
    );

    // Get connected action nodes
    const connectedIds = adj[eventNode.id] || [];
    const actionLines = [];

    const processNode = (nodeId, indent, visiting = new Set()) => {
      const prefix = '        ' + '    '.repeat(indent);
      if (visiting.has(nodeId)) {
        actionLines.push(`${prefix}# 检测到循环引用，已停止递归以避免死循环`);
        return;
      }
      const nextVisiting = new Set(visiting);
      nextVisiting.add(nodeId);

      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const nodeDef = MOD_SDK_NODES.find(n => n.id === node.data.sdkId);
      const params = node.data.params || [];

      if (node.type === 'action') {
        switch (node.data.sdkId) {
          case 'act_send_msg':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreateMsg(${params[0]?.value || 'playerId'})`);
            actionLines.push(`${prefix}comp.NotifyOneMessage(${params[0]?.value || 'playerId'}, "${params[1]?.value || 'Hello!'}")`);
            break;
          case 'act_run_command':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreateCommand(serverApi.GetLevelId())`);
            actionLines.push(`${prefix}comp.SetCommand("${params[0]?.value || '/say Hello'}")`);
            break;
          case 'act_teleport':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreatePos(${params[0]?.value || 'playerId'})`);
            actionLines.push(`${prefix}comp.SetPos((${params[1]?.value || '0'}, ${params[2]?.value || '64'}, ${params[3]?.value || '0'}))`);
            break;
          case 'act_spawn_entity':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}serverApi.GetEngineCompFactory().CreateGame(serverApi.GetLevelId()).CreateEntityByType("${params[0]?.value || 'minecraft:zombie'}", (${params[1]?.value || '0'}, ${params[2]?.value || '64'}, ${params[3]?.value || '0'}), (0, 0))`);
            break;
          case 'act_set_block':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreateBlockInfo(serverApi.GetLevelId())`);
            actionLines.push(`${prefix}comp.SetBlockNew((${params[1]?.value || '0'}, ${params[2]?.value || '64'}, ${params[3]?.value || '0'}), {"name": "${params[0]?.value || 'minecraft:stone'}"})`);
            break;
          case 'act_print':
            actionLines.push(`${prefix}print "${params[0]?.value || 'Debug info'}"`);
            break;
          case 'act_explosion':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreateExplosion(serverApi.GetLevelId())`);
            actionLines.push(`${prefix}comp.CreateExplosion((${params[0]?.value || '0'}, ${params[1]?.value || '64'}, ${params[2]?.value || '0'}), ${params[3]?.value || '3'})`);
            break;
          case 'act_set_health':
            actionLines.push(`${prefix}# ${node.data.label}`);
            actionLines.push(`${prefix}comp = serverApi.GetEngineCompFactory().CreateAttr(${params[0]?.value || 'entityId'})`);
            actionLines.push(`${prefix}comp.SetAttrValue(0, ${params[1]?.value || '20'})  # 0 = health`);
            break;
          default:
            actionLines.push(`${prefix}# TODO: ${node.data.label}`);
            actionLines.push(`${prefix}pass`);
        }
      } else if (node.type === 'condition') {
        actionLines.push(`${prefix}# ${node.data.label}`);
        const lv = params[0]?.value || 'a';
        const op = params[1]?.value || '==';
        const rv = params[2]?.value || 'b';
        actionLines.push(`${prefix}if ${lv} ${op} ${rv}:`);

        const trueEdges = (adj[nodeId] || []).filter((_, i) => i === 0);
        const falseEdges = (adj[nodeId] || []).filter((_, i) => i === 1);

        if (trueEdges.length > 0) {
          trueEdges.forEach(tid => processNode(tid, indent + 1, nextVisiting));
        } else {
          actionLines.push(`${prefix}    pass`);
        }

        if (falseEdges.length > 0) {
          actionLines.push(`${prefix}else:`);
          falseEdges.forEach(fid => processNode(fid, indent + 1, nextVisiting));
        }
      } else if (node.type === 'variable') {
        switch (node.data.sdkId) {
          case 'var_set':
            actionLines.push(`${prefix}self.${params[0]?.value || 'myVar'} = ${params[1]?.value || '0'}`);
            break;
          case 'var_add':
            actionLines.push(`${prefix}self.${params[0]?.value || 'myVar'} += ${params[1]?.value || '1'}`);
            break;
          case 'var_get_pos':
            actionLines.push(`${prefix}pos_comp = serverApi.GetEngineCompFactory().CreatePos(${params[0]?.value || 'entityId'})`);
            actionLines.push(`${prefix}pos = pos_comp.GetPos()`);
            break;
          default:
            actionLines.push(`${prefix}# ${node.data.label}`);
        }
      }

      // Process downstream nodes
      (adj[nodeId] || []).forEach(nextId => {
        if (node.type !== 'condition') {
          processNode(nextId, indent, nextVisiting);
        }
      });
    };

    connectedIds.forEach(id => processNode(id, 1));

    // Build handler function
    const outputParams = sdkDef.outputs || [];
    const paramExtracts = outputParams.map(p => `        ${p} = args.get("${p === 'playerId' ? 'id' : p}", "")`);

    handlers.push(`
    def ${handlerName}(self, args):
        """${sdkDef.label} - ${eventName}"""
${paramExtracts.join('\n')}
${actionLines.length > 0 ? actionLines.join('\n') : '        pass'}
`);
  });

  // Assemble full code
  return `# -*- coding: utf-8 -*-
# ==============================================
# 由 MC Studio macOS 逻辑编辑器自动生成
# 生成时间: ${new Date().toLocaleString('zh-CN')}
# 请勿手动编辑此文件，修改请在逻辑编辑器中操作
# ==============================================

import mod.server.extraServerApi as serverApi

ServerSystem = serverApi.GetServerSystemCls()

class LogicGeneratedSystem(ServerSystem):
    """逻辑编辑器生成的服务端系统"""

    def __init__(self, namespace, systemName):
        ServerSystem.__init__(self, namespace, systemName)
        print "LogicGeneratedSystem initialized"
        self._initVariables()
        self._initEvents()

    def _initVariables(self):
        """初始化变量"""
        pass

    def _initEvents(self):
        """初始化事件监听"""
${registrations.length > 0 ? registrations.join('\n') : '        pass'}
${handlers.join('\n')}
    def Destroy(self):
        """系统销毁"""
        self.UnListenAllEvents()
`;
}
