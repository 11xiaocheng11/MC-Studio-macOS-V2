import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useProjectStore from '../../store/projectStore';
import { MOD_SDK_NODES, generatePythonCode } from './ModSDKNodes';

// === Custom Node Components ===
function EventNodeComponent({ data }) {
  return (
    <div className="logic-node logic-node--event">
      <Handle type="source" position={Position.Bottom} style={{ background: '#00e676' }} />
      <div className="logic-node__title">
        <span style={{ color: '#00e676' }}>⚡</span>
        <span>{data.label}</span>
      </div>
      {data.outputs?.map((output, i) => (
        <div key={i} className="logic-node__port">
          <span style={{ color: '#00e676', fontSize: 8 }}>●</span>
          <span>{output}</span>
        </div>
      ))}
    </div>
  );
}

function ActionNodeComponent({ data }) {
  return (
    <div className="logic-node logic-node--action">
      <Handle type="target" position={Position.Top} style={{ background: '#00d2ff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#00d2ff' }} />
      <div className="logic-node__title">
        <span style={{ color: '#00d2ff' }}>▶</span>
        <span>{data.label}</span>
      </div>
      {data.params?.map((param, i) => (
        <div key={i} className="logic-node__port">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{param.name}:</span>
          <input
            style={{
              background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text-primary)',
              width: 80, fontFamily: 'var(--font-mono)',
            }}
            defaultValue={param.default || ''}
            onChange={e => { param.value = e.target.value; }}
          />
        </div>
      ))}
    </div>
  );
}

function ConditionNodeComponent({ data }) {
  return (
    <div className="logic-node logic-node--condition">
      <Handle type="target" position={Position.Top} style={{ background: '#ff9100' }} />
      <Handle type="source" position={Position.Bottom} id="true" style={{ background: '#00e676', left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ background: '#ff1744', left: '70%' }} />
      <div className="logic-node__title">
        <span style={{ color: '#ff9100' }}>◆</span>
        <span>{data.label}</span>
      </div>
      {data.params?.map((param, i) => (
        <div key={i} className="logic-node__port">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{param.name}:</span>
          <input
            style={{
              background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text-primary)',
              width: 80, fontFamily: 'var(--font-mono)',
            }}
            defaultValue={param.default || ''}
            onChange={e => { param.value = e.target.value; }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4 }}>
        <span style={{ color: '#00e676' }}>✓ True</span>
        <span style={{ color: '#ff1744' }}>✕ False</span>
      </div>
    </div>
  );
}

function VariableNodeComponent({ data }) {
  return (
    <div className="logic-node logic-node--variable">
      <Handle type="target" position={Position.Top} style={{ background: '#7b2ff7' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#7b2ff7' }} />
      <div className="logic-node__title">
        <span style={{ color: '#7b2ff7' }}>◉</span>
        <span>{data.label}</span>
      </div>
      {data.params?.map((param, i) => (
        <div key={i} className="logic-node__port">
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{param.name}:</span>
          <input
            style={{
              background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'var(--text-primary)',
              width: 80, fontFamily: 'var(--font-mono)',
            }}
            defaultValue={param.default || ''}
            onChange={e => { param.value = e.target.value; }}
          />
        </div>
      ))}
    </div>
  );
}

const nodeTypes = {
  event: EventNodeComponent,
  action: ActionNodeComponent,
  condition: ConditionNodeComponent,
  variable: VariableNodeComponent,
};

// === Node Palette ===
function NodePalette({ onAddNode }) {
  const [category, setCategory] = useState('event');

  const filteredNodes = MOD_SDK_NODES.filter(n => n.type === category);

  return (
    <div style={{
      width: 240, borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 8 }}>
          NODE PALETTE
        </div>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {['event', 'action', 'condition', 'variable'].map(cat => (
            <button
              key={cat}
              className={`btn btn--sm ${category === cat ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setCategory(cat)}
              style={{ padding: '3px 8px', fontSize: 10, textTransform: 'capitalize' }}
            >
              {cat === 'event' ? '⚡' : cat === 'action' ? '▶' : cat === 'condition' ? '◆' : '◉'} {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {filteredNodes.map(node => (
          <div
            key={node.id}
            style={{
              padding: '8px 12px', marginBottom: 4,
              background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', fontSize: 12, transition: 'background 0.15s',
              border: '1px solid transparent',
            }}
            onClick={() => onAddNode(node)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {node.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {node.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Main Logic Editor ===
export default function LogicEditorView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [preflightReport, setPreflightReport] = useState([]);

  const onConnect = useCallback((params) => {
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#00d2ff' } }, eds));
  }, [setEdges]);

  const handleAddNode = useCallback((nodeDef) => {
    const id = `${nodeDef.type}_${Date.now()}`;
    const newNode = {
      id,
      type: nodeDef.type,
      position: { x: 250 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        label: nodeDef.label,
        outputs: nodeDef.outputs || [],
        params: nodeDef.params?.map(p => ({ ...p })) || [],
        sdkId: nodeDef.id,
      },
    };
    setNodes(nds => [...nds, newNode]);
  }, [setNodes]);

  const runPreflight = useCallback(() => {
    const issues = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const incoming = new Map(nodes.map(n => [n.id, 0]));
    const outgoing = new Map(nodes.map(n => [n.id, 0]));
    const eventNodes = nodes.filter(n => n.type === 'event');

    if (nodes.length === 0) {
      issues.push({ level: 'error', message: '画布为空，请至少添加一个事件节点。' });
    }
    if (eventNodes.length === 0) {
      issues.push({ level: 'error', message: '缺少事件节点，无法生成有效入口函数。' });
    }

    edges.forEach((e) => {
      if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) {
        issues.push({ level: 'error', message: `存在无效连线：${e.source} -> ${e.target}` });
        return;
      }
      outgoing.set(e.source, (outgoing.get(e.source) || 0) + 1);
      incoming.set(e.target, (incoming.get(e.target) || 0) + 1);
    });

    nodes.forEach((n) => {
      const inCount = incoming.get(n.id) || 0;
      const outCount = outgoing.get(n.id) || 0;
      if (n.type !== 'event' && inCount === 0) {
        issues.push({ level: 'warning', message: `节点「${n.data?.label || n.id}」未连接到事件入口。` });
      }
      if (inCount === 0 && outCount === 0) {
        issues.push({ level: 'warning', message: `节点「${n.data?.label || n.id}」是孤立节点。` });
      }
      if (n.type === 'condition' && outCount > 2) {
        issues.push({ level: 'warning', message: `条件节点「${n.data?.label || n.id}」的输出超过 2 条，生成代码时仅按前两条处理。` });
      }
    });

    setPreflightReport(issues);
    const errorCount = issues.filter(i => i.level === 'error').length;
    const warningCount = issues.filter(i => i.level === 'warning').length;
    if (errorCount > 0) {
      addToast('error', `生成前校验失败：${errorCount} 个错误`);
      return { ok: false, issues };
    }
    if (warningCount > 0) {
      addToast('warning', `生成前校验通过，但有 ${warningCount} 个警告`);
    } else {
      addToast('success', '生成前校验通过');
    }
    return { ok: true, issues };
  }, [nodes, edges, addToast]);

  const handleGenerateCode = () => {
    const preflight = runPreflight();
    if (!preflight.ok) return;
    const code = generatePythonCode(nodes, edges);
    setGeneratedCode(code);
    setShowCode(true);
    addToast('success', 'Python 2.7 代码已生成');
  };

  const handleSaveCode = async () => {
    if (!currentProject || !generatedCode) return;
    const filePath = `${currentProject.path}/behavior_pack/scripts/server/LogicGenerated.py`;
    if (window.electronAPI) {
      await window.electronAPI.fs.writeFile(filePath, generatedCode);
      addToast('success', '代码已保存到 scripts/server/LogicGenerated.py');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-header__title">🧩 逻辑编辑器</h1>
        <div className="page-header__actions">
          <button className="btn btn--secondary" onClick={runPreflight}>🔍 生成前校验</button>
          <button className="btn btn--secondary" onClick={() => setShowCode(!showCode)}>
            {showCode ? '🎨 画布' : '📝 查看代码'}
          </button>
          <button className="btn btn--primary" onClick={handleGenerateCode}>
            ⚡ 生成 Python 代码
          </button>
          {showCode && generatedCode && (
            <button className="btn btn--primary" onClick={handleSaveCode}>💾 保存到项目</button>
          )}
        </div>
      </div>

      {preflightReport.length > 0 && (
        <div style={{
          margin: '0 20px 12px',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-primary)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12,
          maxHeight: 120,
          overflow: 'auto',
        }}>
          {preflightReport.map((item, idx) => (
            <div key={idx} style={{ color: item.level === 'error' ? '#ff6b6b' : '#f59e0b', marginBottom: 4 }}>
              {item.level === 'error' ? '❌' : '⚠️'} {item.message}
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NodePalette onAddNode={handleAddNode} />

        <div style={{ flex: 1, position: 'relative' }}>
          {showCode ? (
            <div style={{ height: '100%', overflow: 'auto', padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 12 }}>
                GENERATED PYTHON 2.7 CODE
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                background: 'var(--bg-primary)',
                padding: 20,
                borderRadius: 'var(--radius-md)',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {generatedCode || '// 点击「生成 Python 代码」按钮生成代码'}
              </pre>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              style={{ background: '#0d0d1a' }}
              defaultEdgeOptions={{
                animated: true,
                style: { stroke: '#00d2ff', strokeWidth: 2 },
              }}
            >
              <Background color="#1a1a2e" gap={20} size={1} />
              <Controls style={{ bottom: 12, left: 12 }} />
              <MiniMap
                style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)' }}
                nodeColor="#243b6e"
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
}
