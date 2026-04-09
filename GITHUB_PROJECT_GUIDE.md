# MC Studio macOS - Complete GitHub Guide

> Bilingual project guide for GitHub release (Chinese + English)  
> 适用于 GitHub 发布的中英文完整文档

---

## 1. 项目概述（中文）

MC Studio macOS 是一个面向 macOS 开发者的网易版《我的世界》模组开发工具，基于 Electron + React 构建，覆盖项目创建、代码编辑、JSON 可视化、逻辑编排、打包预检、移动端推送、Wine/GPTK 运行调试等环节。

目标：让无法使用官方 Windows MC Studio 的 macOS 用户，具备完整的开发与测试流程。

---

## 2. Validation Report（中文）

### 2.1 本次验证范围

- 环境可用性（Node/NPM）
- 前端构建可用性（Vite build）
- 桌面打包可用性（electron-builder DMG）
- E2E 导入流程脚本可复现性（`test-import-flow.mjs`）
- 源码级功能完整性核验（主流程模块）

### 2.2 已执行命令

```bash
npm -v && node -v
npm run build
node test-import-flow.mjs
npm run electron:build
```

### 2.3 验证结果摘要

- `npm run build`：通过（产物生成成功）
- `npm run electron:build`：通过（成功产出 universal DMG）
- DMG 产物：
  - `release/MC Studio macOS-1.0.0-universal.dmg`
  - `release/MC Studio macOS-1.0.0-universal.dmg.blockmap`
- 证书签名：未签名（本机无有效 Developer ID，属于本地打包常见状态）
- `test-import-flow.mjs`：脚本运行到导入阶段失败，原因是缺失默认示例文件 `sample-mods/Waystones.zip`（可复现性问题，不影响主应用打包）

### 2.4 发现的问题 / 风险

- E2E 示例资源缺失：
  - `test-import-flow.mjs` 默认依赖 `sample-mods/Waystones.zip`，仓库未包含该文件。
  - 建议：补充 `sample-mods/README.md` 与示例包，或将脚本改为强制命令行传参并给出清晰错误提示。
- 推送测试二维码：
  - 当前页面使用 canvas 生成“二维码样式占位图”，不是标准二维码编码库流程。
  - 建议：改为直接使用 `qrcode` 依赖生成标准 QR，提升真实扫码成功率与一致性。
- 产物签名：
  - DMG 可构建但未签名，首次分发会触发 macOS 安全提醒。
  - 建议：发布版接入 Developer ID 签名与 notarization。

---

## 3. 架构说明（中文）

### 3.1 技术栈

- Desktop: Electron 28
- Frontend: React 18 + Vite 5
- State: Zustand
- Editor: Monaco
- 3D: Three.js + React Three Fiber
- Node Graph: @xyflow/react
- Packaging: archiver（zip）+ system 7z
- Push Server: Express

### 3.2 分层结构

- `electron/`：主进程与 IPC 能力
  - 文件系统读写
  - 打包（zip/7z）
  - Wine/GPTK 检测、启动、日志
  - 本地 HTTP 推送服务
  - Mod 下载/安装
- `src/`：渲染层 UI
  - `App.jsx` 使用 `activeView` 切换功能页
  - `store/` 维护项目、编辑器、设置状态
  - `components/` 按页面模块组织

### 3.3 核心数据流

1. UI 触发操作（如创建项目、打包）  
2. Zustand store 调用 `window.electronAPI`  
3. `preload.js` 桥接到 `ipcMain.handle(...)`  
4. 主进程执行 Node/系统能力并返回结果  
5. UI 展示结果与日志反馈

---

## 4. 功能完整性矩阵（中文）

| 模块 | 状态 | 说明 |
|---|---|---|
| 项目创建/导入 | 可用 | 可生成结构、manifest、模板脚本，支持 zip/mcaddon/mcpack 导入 |
| 代码编辑（Monaco） | 可用 | 多标签、Python/JSON 高亮、保存、快捷键 |
| JSON 可视化编辑 | 可用 | 实体/方块/物品模板生成并写入项目 |
| 逻辑编辑器 | 可用（中） | 节点编排 + Python 代码生成，复杂逻辑仍需人工复核 |
| 地图编辑器 | 可用（中） | 3D 放置/删除/撤销重做，偏原型能力 |
| 打包预检 | 可用（高） | 多规则检查 + 一键修复 + zip/mcaddon/7z |
| 推送测试 | 可用（中） | 内建 HTTP 下载链路可用，二维码建议升级为标准实现 |
| Wine/GPTK 管理 | 可用（高） | 检测后端、初始化前缀、启动游戏、同步项目、日志回传 |
| Modrinth 内容库 | 可用（中高） | 搜索、版本查看、下载并安装到 Wine 管理目录 |
| Works 子页 | 部分完成 | 多数为展示/导航壳，真实业务流程较少 |

---

## 5. 使用说明（中文）

### 5.1 开发环境要求

- macOS（建议 Apple Silicon 或 Intel 新版本系统）
- Node.js 20+
- npm 10+

可选：
- `p7zip`（支持 `.7z` 打包）
- Wine / CrossOver / GPTK（用于 Windows 版开发包调试）

### 5.2 本地开发启动

```bash
npm install
npm run electron:dev
```

仅前端调试：

```bash
npm run dev
```

### 5.3 构建与发布

```bash
npm run build
npm run electron:build
```

输出目录：

- `dist/`：前端产物
- `release/`：桌面安装包与构建配置

### 5.4 推荐使用流程

1. 创作页新建或导入项目  
2. 代码编辑/JSON 编辑/逻辑编辑  
3. 发布与管理中运行预检并一键修复  
4. 选择 `.mcaddon`/`.zip`/`.7z` 打包  
5. 使用推送测试（移动端）或 Wine/GPTK（PC 端）验证

---

## 6. Roadmap（中文）

- 将推送测试二维码改为标准 `qrcode` 编码输出
- 为 `test-import-flow.mjs` 增加仓库内可复现示例资源
- 增加自动化测试（store/预检规则/IPC mock）
- 完成 Works 系列页面的真实数据与动作闭环
- 发布链路加入签名与 notarization

---

## 7. Project Overview (English)

MC Studio macOS is a desktop mod development workstation for NetEase Minecraft creators on macOS.  
It is built with Electron + React, and covers project scaffolding, code editing, JSON visual editing, logic graph generation, packaging pre-checks, mobile push testing, and Wine/GPTK-based runtime debugging.

---

## 8. Validation Report (English)

### 8.1 Scope

- Runtime/toolchain availability
- Frontend production build
- Electron DMG packaging
- E2E import script reproducibility
- Source-level functional completeness review

### 8.2 Executed Commands

```bash
npm -v && node -v
npm run build
node test-import-flow.mjs
npm run electron:build
```

### 8.3 Results

- `npm run build`: passed
- `npm run electron:build`: passed
- DMG generated successfully:
  - `release/MC Studio macOS-1.0.0-universal.dmg`
  - `release/MC Studio macOS-1.0.0-universal.dmg.blockmap`
- Code signing was skipped (no valid local Developer ID identity)
- `test-import-flow.mjs` failed at import stage due to missing default sample file `sample-mods/Waystones.zip`

### 8.4 Issues / Risks

- Missing sample artifact for E2E script reproducibility
- Push-test QR currently uses a visual placeholder pattern, not strict standard encoding
- Release package is unsigned in local build context

---

## 9. Architecture (English)

### 9.1 Stack

- Electron 28, React 18, Vite 5
- Zustand for state
- Monaco editor
- Three.js + React Three Fiber
- React Flow (`@xyflow/react`)
- Archiver + system 7z
- Express for push-test HTTP server

### 9.2 Layers

- `electron/`: privileged main-process capabilities (IPC handlers)
- `src/`: renderer UI pages/components
- `store/`: project/editor/settings state and actions

### 9.3 Data Flow

UI action -> Zustand store -> `window.electronAPI` -> IPC main handler -> system operation -> UI feedback.

---

## 10. Feature Matrix (English)

| Module | Status | Notes |
|---|---|---|
| Project create/import | Ready | Template generation and zip/mcpack/mcaddon import |
| Code editor | Ready | Multi-tab Monaco flow with save shortcuts |
| JSON visual editor | Ready | Entity/block/item generation into project files |
| Logic editor | Medium-ready | Graph to Python code generation, complex logic needs review |
| Map editor | Medium-ready | 3D voxel editing, more production hardening needed |
| Packaging pre-check | High-ready | Rule checks, auto-fix, multi-format packaging |
| Push test | Medium-ready | HTTP flow works; QR implementation should be upgraded |
| Wine/GPTK manager | High-ready | Detection, prefix init, game launch, sync, logs |
| Modrinth browser | Medium-high | Search, download, install integration |
| Works sub-pages | Partial | Mostly shell/navigation with limited backend behavior |

---

## 11. Quick Start (English)

### 11.1 Setup

```bash
npm install
npm run electron:dev
```

Frontend-only:

```bash
npm run dev
```

### 11.2 Build

```bash
npm run build
npm run electron:build
```

Outputs:

- `dist/` frontend artifacts
- `release/` DMG and build metadata

### 11.3 Suggested Workflow

1. Create or import project  
2. Edit with code/JSON/logic tools  
3. Run pre-check and auto-fix  
4. Package as `.mcaddon` / `.zip` / `.7z`  
5. Validate via push-test or Wine/GPTK runtime

---

## 12. License

MIT License.

