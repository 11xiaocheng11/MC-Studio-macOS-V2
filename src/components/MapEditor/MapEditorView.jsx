import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Stats } from '@react-three/drei';
import * as THREE from 'three';

// === Block Types ===
const BLOCK_TYPES = {
  stone: { name: '石头', color: '#7F7F7F', category: '建筑' },
  grass: { name: '草方块', color: '#5B8731', category: '自然' },
  dirt: { name: '泥土', color: '#866043', category: '自然' },
  cobblestone: { name: '圆石', color: '#6B6B6B', category: '建筑' },
  oak_planks: { name: '橡木板', color: '#BC9862', category: '建筑' },
  sand: { name: '沙子', color: '#DBD3A0', category: '自然' },
  gravel: { name: '砂砾', color: '#857672', category: '自然' },
  oak_log: { name: '橡木原木', color: '#6B5028', category: '自然' },
  leaves: { name: '树叶', color: '#3A5F0B', category: '自然' },
  glass: { name: '玻璃', color: '#C0E8F0', category: '建筑', transparent: true },
  brick: { name: '红砖', color: '#9B4C3C', category: '建筑' },
  tnt: { name: 'TNT', color: '#DB2B00', category: '红石' },
  iron_block: { name: '铁块', color: '#DBDBDB', category: '建筑' },
  gold_block: { name: '金块', color: '#F5DA25', category: '装饰' },
  diamond_block: { name: '钻石块', color: '#2CCDB1', category: '装饰' },
  redstone_block: { name: '红石块', color: '#FF0000', category: '红石' },
  lapis_block: { name: '青金石块', color: '#1B48C4', category: '装饰' },
  emerald_block: { name: '绿宝石块', color: '#17DD62', category: '装饰' },
  obsidian: { name: '黑曜石', color: '#1B1029', category: '建筑' },
  glowstone: { name: '荧石', color: '#FFEE6F', category: '装饰', emissive: true },
  water: { name: '水', color: '#3F76E4', category: '自然', transparent: true },
  lava: { name: '岩浆', color: '#CF5B0E', category: '自然', emissive: true },
  bedrock: { name: '基岩', color: '#555555', category: '建筑' },
  wool_white: { name: '白色羊毛', color: '#E9ECEC', category: '装饰' },
  wool_red: { name: '红色羊毛', color: '#A12722', category: '装饰' },
  wool_blue: { name: '蓝色羊毛', color: '#3C44AA', category: '装饰' },
  wool_green: { name: '绿色羊毛', color: '#5D7C15', category: '装饰' },
  wool_yellow: { name: '黄色羊毛', color: '#FED83D', category: '装饰' },
  wool_purple: { name: '紫色羊毛', color: '#7B2FBE', category: '装饰' },
  wool_orange: { name: '橙色羊毛', color: '#F9801D', category: '装饰' },
};

const CATEGORIES = ['全部', '建筑', '自然', '装饰', '红石'];

// === Voxel Block Component ===
function VoxelBlock({ position, blockType, onPointerDown, onPointerOver, isHovered }) {
  const type = BLOCK_TYPES[blockType] || BLOCK_TYPES.stone;
  const meshRef = useRef();

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={type.color}
        transparent={type.transparent || false}
        opacity={type.transparent ? 0.6 : 1}
        emissive={type.emissive ? type.color : '#000000'}
        emissiveIntensity={type.emissive ? 0.5 : 0}
        roughness={0.8}
        metalness={0.1}
      />
      {isHovered && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.01, 1.01, 1.01)]} />
          <lineBasicMaterial color="#00d2ff" linewidth={2} />
        </lineSegments>
      )}
    </mesh>
  );
}

// === Ground Plane for initial placement ===
function GroundPlane({ onPointerDown }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      onPointerDown={onPointerDown}
      receiveShadow
    >
      <planeGeometry args={[64, 64]} />
      <meshStandardMaterial color="#2a2a2a" transparent opacity={0.3} />
    </mesh>
  );
}

// === 3D Scene ===
function VoxelScene({ blocks, tool, selectedBlock, onBlockAdd, onBlockRemove }) {
  const [hoveredPos, setHoveredPos] = useState(null);

  const handleBlockClick = (e, existingPos) => {
    e.stopPropagation();
    if (tool === 'delete') {
      const key = `${existingPos[0]},${existingPos[1]},${existingPos[2]}`;
      onBlockRemove(key);
    } else if (tool === 'place') {
      // Place adjacent to the clicked face
      const normal = e.face.normal;
      const newPos = [
        existingPos[0] + normal.x,
        existingPos[1] + normal.y,
        existingPos[2] + normal.z,
      ];
      // Check bounds (64x64x64)
      if (newPos[0] >= -32 && newPos[0] < 32 && newPos[1] >= 0 && newPos[1] < 64 && newPos[2] >= -32 && newPos[2] < 32) {
        const key = `${newPos[0]},${newPos[1]},${newPos[2]}`;
        onBlockAdd(key, selectedBlock, newPos);
      }
    }
  };

  const handleGroundClick = (e) => {
    if (tool !== 'place') return;
    e.stopPropagation();
    const point = e.point;
    const x = Math.round(point.x);
    const z = Math.round(point.z);
    if (x >= -32 && x < 32 && z >= -32 && z < 32) {
      const key = `${x},0,${z}`;
      onBlockAdd(key, selectedBlock, [x, 0, z]);
    }
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[20, 40, 20]} intensity={0.8} castShadow />
      <directionalLight position={[-10, 20, -10]} intensity={0.3} />

      <Sky sunPosition={[100, 50, 100]} />

      <GroundPlane onPointerDown={handleGroundClick} />

      <Grid
        position={[0, -0.49, 0]}
        args={[64, 64]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a1a2e"
        sectionSize={8}
        sectionThickness={1}
        sectionColor="#243b6e"
        fadeDistance={80}
        infiniteGrid
      />

      {Object.entries(blocks).map(([key, block]) => (
        <VoxelBlock
          key={key}
          position={block.position}
          blockType={block.type}
          onPointerDown={(e) => handleBlockClick(e, block.position)}
          onPointerOver={() => setHoveredPos(key)}
          isHovered={hoveredPos === key}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan
        enableRotate
        enableZoom
        panSpeed={1}
        rotateSpeed={0.5}
        zoomSpeed={1.2}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 5, 0]}
      />
    </>
  );
}

// === Block Palette Panel ===
function BlockPalette({ selectedBlock, onSelect }) {
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');

  const filtered = Object.entries(BLOCK_TYPES).filter(([id, block]) => {
    if (category !== '全部' && block.category !== category) return false;
    if (search && !block.name.includes(search) && !id.includes(search)) return false;
    return true;
  });

  return (
    <div className="block-palette">
      <div className="block-palette__search">
        <input
          className="input"
          placeholder="搜索方块..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '6px 10px', fontSize: 12 }}
        />
        <div style={{ display: 'flex', gap: 2, marginTop: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`btn btn--sm ${category === cat ? 'btn--primary' : 'btn--ghost'}`}
              onClick={() => setCategory(cat)}
              style={{ padding: '2px 8px', fontSize: 10 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="block-palette__grid">
        {filtered.map(([id, block]) => (
          <div
            key={id}
            className={`block-swatch ${selectedBlock === id ? 'block-swatch--selected' : ''}`}
            style={{ backgroundColor: block.color }}
            onClick={() => onSelect(id)}
            title={block.name}
          />
        ))}
      </div>
    </div>
  );
}

// === Main Map Editor ===
export default function MapEditorView({ addToast }) {
  const [blocks, setBlocks] = useState({});
  const [tool, setTool] = useState('place');
  const [selectedBlock, setSelectedBlock] = useState('stone');
  const [showPalette, setShowPalette] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveHistory = useCallback((newBlocks) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ ...newBlocks });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleAddBlock = useCallback((key, type, position) => {
    setBlocks(prev => {
      if (prev[key]) return prev;
      const newBlocks = { ...prev, [key]: { type, position } };
      saveHistory(newBlocks);
      return newBlocks;
    });
  }, [saveHistory]);

  const handleRemoveBlock = useCallback((key) => {
    setBlocks(prev => {
      const newBlocks = { ...prev };
      delete newBlocks[key];
      saveHistory(newBlocks);
      return newBlocks;
    });
  }, [saveHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const clearAll = () => {
    if (confirm('确定清空所有方块？')) {
      saveHistory({});
      setBlocks({});
      addToast('info', '已清空所有方块');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [historyIndex, history]);

  const blockCount = Object.keys(blocks).length;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [20, 20, 20], fov: 50, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        style={{ background: '#0a0a1a' }}
      >
        <VoxelScene
          blocks={blocks}
          tool={tool}
          selectedBlock={selectedBlock}
          onBlockAdd={handleAddBlock}
          onBlockRemove={handleRemoveBlock}
        />
      </Canvas>

      {/* Toolbar */}
      <div className="toolbar-3d">
        <button
          className={`toolbar-3d__btn ${tool === 'place' ? 'toolbar-3d__btn--active' : ''}`}
          onClick={() => setTool('place')}
          title="放置方块"
        >
          🔨
        </button>
        <button
          className={`toolbar-3d__btn ${tool === 'delete' ? 'toolbar-3d__btn--active' : ''}`}
          onClick={() => setTool('delete')}
          title="删除方块"
        >
          🗑
        </button>
        <div className="toolbar-3d__separator" />
        <button className="toolbar-3d__btn" onClick={undo} title="撤销 (⌘Z)">↩</button>
        <button className="toolbar-3d__btn" onClick={redo} title="重做 (⌘⇧Z)">↪</button>
        <div className="toolbar-3d__separator" />
        <button className="toolbar-3d__btn" onClick={clearAll} title="清空">🗑️</button>
        <button
          className={`toolbar-3d__btn ${showPalette ? 'toolbar-3d__btn--active' : ''}`}
          onClick={() => setShowPalette(!showPalette)}
          title="方块面板"
        >
          🎨
        </button>
      </div>

      {/* Block Info */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        background: 'var(--glass-bg)', backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)',
        padding: '8px 16px', fontSize: 12, color: 'var(--text-secondary)',
        display: 'flex', gap: 16,
      }}>
        <span>方块数: <span style={{ color: 'var(--accent-primary)' }}>{blockCount}</span></span>
        <span>当前: <span style={{ color: BLOCK_TYPES[selectedBlock]?.color }}>
          {BLOCK_TYPES[selectedBlock]?.name}
        </span></span>
        <span>工具: {tool === 'place' ? '🔨 放置' : '🗑 删除'}</span>
        <span>范围: 64×64×64</span>
      </div>

      {/* Block Palette */}
      {showPalette && (
        <BlockPalette selectedBlock={selectedBlock} onSelect={setSelectedBlock} />
      )}
    </div>
  );
}
