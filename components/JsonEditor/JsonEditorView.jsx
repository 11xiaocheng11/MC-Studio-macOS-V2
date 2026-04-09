import React, { useState } from 'react';
import useProjectStore from '../../store/projectStore';

const ENTITY_COMPONENTS = [
  { id: 'collision_box', name: '碰撞箱', fields: [
    { key: 'width', label: '宽度', type: 'number', default: 0.6 },
    { key: 'height', label: '高度', type: 'number', default: 1.8 },
  ]},
  { id: 'health', name: '生命值', fields: [
    { key: 'value', label: '当前生命', type: 'number', default: 20 },
    { key: 'max', label: '最大生命', type: 'number', default: 20 },
  ]},
  { id: 'movement', name: '移动', fields: [
    { key: 'value', label: '移动速度', type: 'number', default: 0.25 },
  ]},
  { id: 'physics', name: '物理', fields: [
    { key: 'has_gravity', label: '有重力', type: 'boolean', default: true },
    { key: 'has_collision', label: '有碰撞', type: 'boolean', default: true },
  ]},
  { id: 'attack', name: '攻击', fields: [
    { key: 'damage', label: '伤害值', type: 'number', default: 2 },
  ]},
  { id: 'follow_range', name: '跟随范围', fields: [
    { key: 'value', label: '范围', type: 'number', default: 16 },
    { key: 'max', label: '最大范围', type: 'number', default: 48 },
  ]},
];

const BLOCK_FIELDS = [
  { key: 'hardness', label: '硬度', type: 'number', default: 1.5 },
  { key: 'resistance', label: '爆炸抗性', type: 'number', default: 6.0 },
  { key: 'friction', label: '摩擦力', type: 'number', default: 0.6 },
  { key: 'light_emission', label: '发光等级', type: 'number', default: 0 },
  { key: 'light_dampening', label: '光照衰减', type: 'number', default: 15 },
  { key: 'flammable', label: '可燃', type: 'boolean', default: false },
];

const ITEM_FIELDS = [
  { key: 'max_stack_size', label: '最大堆叠', type: 'number', default: 64 },
  { key: 'max_damage', label: '最大耐久', type: 'number', default: 0 },
  { key: 'hand_equipped', label: '手持显示', type: 'boolean', default: false },
  { key: 'use_animation', label: '使用动画', type: 'select', options: ['none', 'eat', 'drink', 'bow', 'block'], default: 'none' },
  { key: 'category', label: '分类', type: 'select', options: ['Construction', 'Equipment', 'Items', 'Nature', 'Commands'], default: 'Items' },
];

function FieldEditor({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={value ?? field.default}
          onChange={e => onChange(field.key, e.target.checked)}
          style={{ accentColor: 'var(--accent-primary)' }}
        />
        <span style={{ fontSize: 13 }}>{field.label}</span>
      </label>
    );
  }
  if (field.type === 'select') {
    return (
      <div className="input-group">
        <label>{field.label}</label>
        <select className="input" value={value ?? field.default} onChange={e => onChange(field.key, e.target.value)}>
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }
  return (
    <div className="input-group">
      <label>{field.label}</label>
      <input
        className="input"
        type="number"
        step="0.1"
        value={value ?? field.default}
        onChange={e => onChange(field.key, parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

export default function JsonEditorView({ addToast }) {
  const currentProject = useProjectStore(s => s.currentProject);
  const [editorType, setEditorType] = useState('entity');
  const [entityName, setEntityName] = useState('custom_mob');
  const [entityData, setEntityData] = useState({});
  const [selectedComponents, setSelectedComponents] = useState(['collision_box', 'health']);
  const [blockName, setBlockName] = useState('custom_block');
  const [blockData, setBlockData] = useState({});
  const [itemName, setItemName] = useState('custom_item');
  const [itemData, setItemData] = useState({});

  const updateField = (key, value, setter) => {
    setter(prev => ({ ...prev, [key]: value }));
  };

  const generateEntityJSON = () => {
    const components = {};
    selectedComponents.forEach(compId => {
      const comp = ENTITY_COMPONENTS.find(c => c.id === compId);
      if (comp) {
        const compData = {};
        comp.fields.forEach(f => {
          compData[f.key] = entityData[`${compId}.${f.key}`] ?? f.default;
        });
        components[`minecraft:${compId}`] = compData;
      }
    });

    return {
      format_version: "1.12.0",
      "minecraft:entity": {
        description: {
          identifier: `custom:${entityName}`,
          is_spawnable: true,
          is_summonable: true,
        },
        components,
      },
    };
  };

  const generateBlockJSON = () => ({
    format_version: "1.12.0",
    "minecraft:block": {
      description: {
        identifier: `custom:${blockName}`,
      },
      components: Object.fromEntries(
        BLOCK_FIELDS.map(f => [`minecraft:${f.key}`, blockData[f.key] ?? f.default])
      ),
    },
  });

  const generateItemJSON = () => ({
    format_version: "1.12.0",
    "minecraft:item": {
      description: {
        identifier: `custom:${itemName}`,
        category: itemData.category || 'Items',
      },
      components: {
        "minecraft:max_stack_size": itemData.max_stack_size || 64,
        "minecraft:max_damage": itemData.max_damage || 0,
        "minecraft:hand_equipped": itemData.hand_equipped || false,
        "minecraft:use_animation": itemData.use_animation || "none",
      },
    },
  });

  const getPreviewJSON = () => {
    switch (editorType) {
      case 'entity': return generateEntityJSON();
      case 'block': return generateBlockJSON();
      case 'item': return generateItemJSON();
      default: return {};
    }
  };

  const handleSave = async () => {
    if (!currentProject) {
      addToast('error', '请先打开一个项目');
      return;
    }

    const json = getPreviewJSON();
    const name = editorType === 'entity' ? entityName : editorType === 'block' ? blockName : itemName;
    const dir = editorType === 'entity' ? 'entities' : editorType === 'block' ? 'blocks' : 'items';
    const filePath = `${currentProject.path}/behavior_pack/${dir}/${name}.json`;

    if (window.electronAPI) {
      await window.electronAPI.fs.mkdir(`${currentProject.path}/behavior_pack/${dir}`);
      await window.electronAPI.fs.writeFile(filePath, JSON.stringify(json, null, 2));
      addToast('success', `${name}.json 已保存到 ${dir}/`);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h1 className="page-header__title">📋 JSON 可视化编辑</h1>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={handleSave}>💾 保存到项目</button>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="tabs">
        <button className={`tab ${editorType === 'entity' ? 'tab--active' : ''}`} onClick={() => setEditorType('entity')}>🐾 实体</button>
        <button className={`tab ${editorType === 'block' ? 'tab--active' : ''}`} onClick={() => setEditorType('block')}>🧱 方块</button>
        <button className={`tab ${editorType === 'item' ? 'tab--active' : ''}`} onClick={() => setEditorType('item')}>⚔️ 物品</button>
      </div>

      {/* Split: Form | Preview */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Form */}
        <div style={{ width: '50%', overflow: 'auto', padding: 20, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {editorType === 'entity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>实体标识符</label>
                <input className="input input--mono" value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="custom_mob" />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                  组件选择
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ENTITY_COMPONENTS.map(comp => (
                    <button
                      key={comp.id}
                      className={`btn btn--sm ${selectedComponents.includes(comp.id) ? 'btn--primary' : 'btn--secondary'}`}
                      onClick={() => {
                        setSelectedComponents(prev =>
                          prev.includes(comp.id) ? prev.filter(c => c !== comp.id) : [...prev, comp.id]
                        );
                      }}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedComponents.map(compId => {
                const comp = ENTITY_COMPONENTS.find(c => c.id === compId);
                if (!comp) return null;
                return (
                  <div key={compId} style={{ padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 12 }}>
                      minecraft:{comp.id}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {comp.fields.map(field => (
                        <FieldEditor
                          key={field.key}
                          field={field}
                          value={entityData[`${compId}.${field.key}`]}
                          onChange={(k, v) => updateField(`${compId}.${k}`, v, setEntityData)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {editorType === 'block' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>方块标识符</label>
                <input className="input input--mono" value={blockName} onChange={e => setBlockName(e.target.value)} placeholder="custom_block" />
              </div>
              {BLOCK_FIELDS.map(field => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={blockData[field.key]}
                  onChange={(k, v) => updateField(k, v, setBlockData)}
                />
              ))}
            </div>
          )}

          {editorType === 'item' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label>物品标识符</label>
                <input className="input input--mono" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="custom_item" />
              </div>
              {ITEM_FIELDS.map(field => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={itemData[field.key]}
                  onChange={(k, v) => updateField(k, v, setItemData)}
                />
              ))}
            </div>
          )}
        </div>

        {/* JSON Preview */}
        <div style={{ width: '50%', overflow: 'auto', padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 9, color: 'var(--accent-primary)', marginBottom: 12 }}>
            JSON PREVIEW
          </div>
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {JSON.stringify(getPreviewJSON(), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
