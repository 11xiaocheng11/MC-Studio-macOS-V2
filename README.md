<div align="center">

# 🍷 MC Studio macOS

**网易版我的世界 · macOS 模组开发工作站**

*NetEase Minecraft China Edition · Mod Development Studio for macOS*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: macOS](https://img.shields.io/badge/Platform-macOS-black?logo=apple)](https://www.apple.com/macos/)
[![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)

[中文](#中文文档) | [English](#english-documentation)

</div>

---

## 中文文档

### 📖 简介

MC Studio macOS 是一款专为 macOS 开发者打造的**网易版《我的世界》模组开发工具**。

由于网易官方 MC Studio 仅支持 Windows，macOS 用户长期无法参与网易平台的模组开发。本工具通过 Electron + React 架构，在 macOS 上实现了从项目创建、代码编写、打包预检到推送测试的完整开发流程，并集成了 Wine/GPTK 支持，可在 macOS 上运行 Windows 版开发包进行调试。

### ✨ 核心功能

#### 🏠 首页 · 开发者中心
- 开发动态与公告展示
- 快捷链接面板（一键跳转官方文档、API 手册、开发者 B 站、QQ 频道等）
- SDK 环境信息展示（Python 2.7.18、基岩版 1.20+）
- 开发小贴士（Python 2.7 语法提醒、manifest 规范、macOS 打包注意事项）

#### ✏️ 创作 · 项目管理
- **新建项目**：支持基岩版组件、基岩版服务器、Python Mod 模板
  - 自动生成 `pack_manifest.json`（`format_version: 1`，无 `min_engine_version`）
  - 自动生成 `entities/dummy.json` 占位文件（防审核错误码 24）
  - 自动生成 `modMain.py` + `ServerSystem` + `ClientSystem` 模板（Python 2.7）
- **本地导入**：支持 `.mcaddon` / `.mcpack` / `.zip` 格式
- **创作工具栏**：新建、导入、性能诊断、工具箱（含 SDK 补全库下载链接）

#### 📁 作品库
- **基岩版组件**：游戏地图 / 联机地图 / 附加包 / 云端列表 / 联机测试
- **基岩版服务器**：网络服开发 / 插件 / 线上网络服 / 第三方网络服
- **Java 版组件**：本地作品 / 云端列表（含 Modrinth 集成和 Java→基岩版移植工作流）
- **Java 版服务器**：线上网络服管理

#### 💻 代码编辑器
- 基于 Monaco Editor（VS Code 同款内核）
- Python 2.7 语法高亮和代码补全
- 文件树浏览和多标签编辑

#### 📝 JSON 编辑器
- `pack_manifest.json` 可视化编辑
- 实体定义 / 物品定义 / 方块定义模板
- JSON Schema 验证

#### 🗺️ 地图编辑器
- Three.js 3D 可视化方块预览
- 方块放置和编辑（创意模式）

#### 🔗 逻辑编辑器
- React Flow 可视化节点编程
- ServerSystem / ClientSystem 事件流编排
- 一键导出为 Python 2.7 代码

#### 📦 发布与管理（打包系统）
- **运行预检**（8 项自动检查 + 一键修复）：

  | 检查项 | 错误码 | 说明 |
  |--------|--------|------|
  | Behavior Pack Manifest | 10 | 自动创建 `pack_manifest.json` |
  | Resource Pack Manifest | 10 | 自动创建 `pack_manifest.json` |
  | macOS 幽灵文件清理 | 33/40 | 删除 `._*`、`.DS_Store`、`__MACOSX` |
  | 引擎版本合规 | **37** | `format_version=1`，删除 `min_engine_version` |
  | 无中文路径 | — | 检测中文字符的文件路径 |
  | entities 目录 | 24 | 自动创建空 entities 目录 + dummy.json |
  | textures 目录 | 24 | 自动创建空 textures 目录 |
  | UUID 唯一性 | 38 | 自动替换重复 UUID |

- **打包格式**：`.zip`（推荐）、`.7z`（需 `brew install p7zip`）
- **mod.info 编辑器**：可视化编辑并保存

#### 🎮 内容库（Modrinth 浏览器）
- 在线浏览 Modrinth 社区的开源 Mod
- 搜索、筛选、下载 `.jar` / `.zip` 源码
- 为 Java→基岩版移植提供素材

#### 📱 推送测试
- 内建 HTTP 服务器，生成 QR 码
- 支持将打包后的 `.zip` / `.mcaddon` 推送至移动设备

#### 🍷 Wine / GPTK 集成
- 自动检测 Wine / Wine64 / CrossOver / GPTK / Homebrew wine-crossover
- ARM64 架构兼容性检查（Apple Silicon 自动检测 Rosetta 2）
- `Minecraft.Windows.exe` 扫描与启动
- Wine Prefix 初始化和管理
- 实时日志输出

#### 🌗 主题切换
- **深色模式**（默认）— 护眼暗黑风格
- **浅色模式** — 清爽白色风格
- 侧边栏底部一键切换，自动记忆偏好（localStorage 持久化）
- 平滑 0.35s 过渡动画

### 🏗️ 架构

```
MC-Studio-macOS/
├── electron/                 # Electron 主进程
│   ├── main.js              # IPC 处理、Wine 集成、打包引擎
│   └── preload.js           # 安全桥接（contextIsolation）
├── src/                     # React 渲染进程
│   ├── App.jsx              # 路由、视图管理、主题状态
│   ├── main.jsx             # React 入口
│   ├── index.css            # 全局样式系统（深色/浅色主题）
│   ├── store/
│   │   └── projectStore.js  # Zustand 状态管理
│   └── components/
│       ├── Layout/          # Titlebar, Sidebar（含主题切换）, StatusBar
│       ├── Home/            # 首页视图
│       ├── ProjectManager/  # 创作页（工具栏 + 项目列表）
│       ├── Works/           # 作品库（4 个子类页面）
│       ├── CodeEditor/      # Monaco 代码编辑器
│       ├── JsonEditor/      # JSON 可视化编辑器
│       ├── MapEditor/       # Three.js 地图编辑器
│       ├── LogicEditor/     # React Flow 逻辑编辑器
│       ├── Packager/        # 打包预检和发布管理
│       ├── ModBrowser/      # Modrinth 内容库浏览器
│       ├── PushTest/        # HTTP 推送测试
│       ├── WineManager/     # Wine/GPTK 管理器
│       └── Common/          # Toast 通知等通用组件
├── build/                   # 应用图标 (.icns, .png)
├── package.json             # 依赖和构建配置
└── vite.config.js           # Vite 构建配置
```

### 🔧 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Electron 28 + React 18 |
| 状态管理 | Zustand 4 |
| 构建工具 | Vite 5 |
| 代码编辑器 | Monaco Editor |
| 3D 引擎 | Three.js + React Three Fiber |
| 节点编辑器 | @xyflow/react |
| 打包引擎 | archiver (zip) + p7zip (7z) |
| HTTP 推送 | Express |
| QR 生成 | qrcode |
| Windows 运行 | Wine / GPTK / CrossOver |

### 📥 安装与使用

#### 方式一：下载 DMG（推荐）

从 [Releases](https://github.com/11xiaocheng11/MC-Studio-macOS-V2/releases) 下载最新的 `.dmg` 文件，拖拽到 Applications 即可。

> ⚠️ 首次打开可能需要：`系统设置 → 隐私与安全性 → 仍然打开`

#### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/11xiaocheng11/MC-Studio-macOS-V2.git
cd MC-Studio-macOS-V2

# 安装依赖
npm install

# 开发模式（Vite + Electron）
npm run electron:dev

# 仅运行前端（浏览器预览）
npm run dev

# 构建 DMG
npm run electron:build
```

#### 可选依赖

```bash
# 7z 打包支持
brew install p7zip

# Wine 支持（Apple Silicon 推荐）
brew install --cask wine-crossover

# 或安装 Game Porting Toolkit (GPTK)
# 参考 Apple 官方文档
```

### 📋 网易审核常见错误码速查

| 错误码 | 含义 | MC Studio 对策 |
|--------|------|---------------|
| 10 | 缺少 manifest | 预检自动创建 `pack_manifest.json` |
| 24 | 缺少 entities/textures 目录 | 预检自动创建空目录 + dummy.json |
| 33/40 | 包含幽灵文件 | 预检自动清理 `._*`、`.DS_Store`、`__MACOSX` |
| 37 | `min_engine_version` 不合规 | 预检强制 `format_version=1`，彻底删除该字段 |
| 38 | UUID 冲突 | 预检自动替换为新 UUID |

### ⚠️ 重要开发规范

1. **Python 2.7 语法** — `print "hello"` 不是 `print("hello")`
2. **pack_manifest.json 必配** — `format_version` 必须为数字 `1`
3. **禁止 min_engine_version** — 必须彻底删除该字段（header、modules、根级别全部删除）
4. **禁止中文路径** — 项目名和文件名只用英文/数字/下划线
5. **macOS 打包排除** — 务必排除 `._*`、`.DS_Store`、`__MACOSX`
6. **entities 目录必须存在** — 即使为空也要保留（behavior_pack 下）
7. **textures 目录必须存在** — 即使为空也要保留（resource_pack 下）

### 🖥️ 系统要求

- macOS 12.0 (Monterey) 或更高版本
- Apple Silicon (M1/M2/M3) 或 Intel Mac
- 约 200MB 磁盘空间

### 📜 许可证

MIT License — 详见 [LICENSE](LICENSE)

### 🙏 致谢

- [网易我的世界开发者平台](https://mc.163.com/dev/)
- [Modrinth](https://modrinth.com/) — 开源 Mod 社区
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code 编辑器内核
- [Electron](https://www.electronjs.org/) — 跨平台桌面框架

---

## English Documentation

### 📖 Introduction

MC Studio macOS is a **mod development tool** for the **NetEase Minecraft China Edition**, built specifically for macOS developers.

Since the official MC Studio only supports Windows, macOS users have been unable to participate in mod development for the NetEase platform. This tool provides a complete development workflow — from project creation, code editing, pre-packaging validation, to push testing — all running natively on macOS, with Wine/GPTK integration for running the Windows dev kit.

### ✨ Key Features

- **Project Management** — Create/import Bedrock addons, Python mods, and server plugins with auto-generated compliant manifests
- **Code Editor** — Monaco-based editor with Python 2.7 syntax highlighting
- **JSON Editor** — Visual editing for `pack_manifest.json`, entity/item/block definitions
- **Map Editor** — Three.js 3D block preview and editing
- **Logic Editor** — Visual node-based programming with React Flow, exports to Python 2.7
- **Packaging & Validation** — 8-rule pre-check system with one-click fixes for NetEase audit errors (codes 10, 24, 33, 37, 38, 40)
- **Modrinth Browser** — Browse and download open-source mods for Java-to-Bedrock porting
- **Push Testing** — Built-in HTTP server with QR code for mobile device testing
- **Wine/GPTK Integration** — Run `Minecraft.Windows.exe` on macOS via Wine, CrossOver, or Apple GPTK
- **Dark / Light Theme** — Toggle between dark and light modes with persistent preference

### 🏗️ Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Main Process | Electron 28 (Node.js) | File I/O, Wine/GPTK control, packaging engine |
| Renderer | React 18 + Vite 5 | UI components and state management |
| State | Zustand 4 | Project data and global state |
| Bridge | contextIsolation + preload.js | Secure IPC between processes |
| Editor | Monaco Editor | Code editing with Python 2.7 support |
| 3D Engine | Three.js + React Three Fiber | Map visualization |
| Node Editor | @xyflow/react | Visual logic programming |
| Theme | CSS Variables + data-theme | Dark/light mode switching |

### 📥 Installation

#### Option 1: Download DMG (Recommended)

Download the latest `.dmg` from [Releases](https://github.com/11xiaocheng11/MC-Studio-macOS-V2/releases).

> ⚠️ First launch may require: `System Settings → Privacy & Security → Open Anyway`

#### Option 2: Build from Source

```bash
git clone https://github.com/11xiaocheng11/MC-Studio-macOS-V2.git
cd MC-Studio-macOS-V2
npm install
npm run electron:dev    # Development mode
npm run electron:build  # Build DMG
```

#### Optional Dependencies

```bash
brew install p7zip              # 7z packaging support
brew install --cask wine-crossover  # Wine for Apple Silicon
```

### 📋 NetEase Audit Error Codes

| Code | Meaning | MC Studio Fix |
|------|---------|--------------|
| 10 | Missing manifest | Auto-creates `pack_manifest.json` |
| 24 | Missing entities/textures dir | Auto-creates empty dir + dummy.json |
| 33/40 | Ghost files present | Auto-removes `._*`, `.DS_Store`, `__MACOSX` |
| 37 | `min_engine_version` violation | Forces `format_version=1`, removes field at all levels |
| 38 | UUID collision | Auto-generates new unique UUIDs |

### ⚠️ Critical Development Rules

1. **Python 2.7 syntax** — `print "hello"` not `print("hello")`
2. **`pack_manifest.json` required** — `format_version` must be integer `1`
3. **No `min_engine_version`** — This field must be completely removed (header, modules, root level)
4. **No Chinese characters in paths** — Use only ASCII for project names and file paths
5. **macOS packaging exclusions** — Always exclude `._*`, `.DS_Store`, `__MACOSX`
6. **`entities/` directory required** — Must exist in `behavior_pack/` even if empty
7. **`textures/` directory required** — Must exist in `resource_pack/` even if empty

### 🖥️ System Requirements

- macOS 12.0 (Monterey) or later
- Apple Silicon (M1/M2/M3) or Intel Mac
- ~200MB disk space

### 📜 License

MIT License — See [LICENSE](LICENSE)

### 🙏 Acknowledgments

- [NetEase Minecraft Developer Platform](https://mc.163.com/dev/)
- [Modrinth](https://modrinth.com/) — Open-source mod community
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Electron](https://www.electronjs.org/)
