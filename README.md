# AI 智能测试平台

基于 Node.js 原生 HTTP 服务和原生 HTML/CSS/JavaScript 构建的测试辅助平台。平台以项目为入口，集中提供需求评审、接口测试、UI 自动化、测试数据生成和性能分析等功能。

## 功能概览

- **项目中心**：创建、编辑、删除和进入项目，可配置大语言模型与视觉语言模型信息。
- **智能体中心**：统一进入各测试辅助模块。
- **需求评审与接口文档分析**：导入需求文档、维护文档树和内容，并查看评审结果。
- **接口测试用例设计**：生成、手动维护、批量删除和导出测试用例。
- **接口自动化**：管理接口用例和测试任务，支持 HTTP、gRPC、WebSocket 类型选择。
- **UI 自动化**：管理 Web 和移动端测试用例及任务。
- **测试任务执行**：查看任务状态、执行记录和测试报告，并支持报告下载。
- **测试数据生成**：配置字段，生成 JSON、XML、CSV 或 SQL 格式的数据，并管理模板。
- **性能数据分析**：配置数据源、选择时间范围、查看历史记录和导出分析报告。

## 当前实现边界

当前项目是一个前端交互原型和轻量数据服务：

- 页面交互、测试执行、需求评审、测试数据和性能分析结果主要由前端模拟生成。
- `llmUrl`、`llmApiKey`、`vlmUrl` 等字段用于保存项目配置，当前代码没有实现对真实模型服务的调用。
- 当前服务端只提供项目和测试任务 JSON 数据接口，没有用户认证、权限控制或数据库。
- 部分 UI 自动化脚本、文档解析和外部数据源接入能力仍属于占位或开发中状态。

## 环境要求

- Node.js 14.0 或更高版本
- 支持现代 JavaScript 的浏览器

项目没有 `package.json`，不需要安装 npm 依赖。

## 启动项目

在项目根目录执行：

```powershell
node server.js
```

服务默认监听 `0.0.0.0:8080`。启动后访问：

```text
http://localhost:8080/
```

停止服务可在终端按 `Ctrl+C`。

## 服务端 API

服务端使用请求体中的 JSON 数组覆盖对应数据文件。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/projects` | 读取项目列表 |
| POST | `/api/projects` | 保存完整项目列表到 `projects.json` |
| GET | `/api/test-tasks` | 读取测试任务列表 |
| POST | `/api/test-tasks` | 保存完整测试任务列表到 `test_tasks.json` |

示例：

```powershell
Invoke-RestMethod -Uri http://localhost:8080/api/projects -Method Get
Invoke-RestMethod -Uri http://localhost:8080/api/test-tasks -Method Get
```

POST 请求需要发送 JSON 数组，并设置 `Content-Type: application/json`。无效 JSON 会返回 HTTP 400。

## 数据与配置

### 服务端文件

- `projects.json`：项目列表及项目配置。
- `test_tasks.json`：测试任务、执行状态和报告数据。

项目配置字段包括：

- `name`、`desc`、`password`
- `llmUrl`、`llmApiKey`、`llmName`
- `vlmUrl`、`vlmApiKey`、`vlmName`

### 浏览器存储

浏览器端使用 `localStorage` 保存页面状态和功能数据，当前键名统一使用 `WT_` 前缀，主要包括：

- `WT_current_project_id`、`WT_current_view`
- `WT_projects`、`WT_test_tasks`
- `WT_test_cases`、`WT_api_cases`、`WT_api_test_tasks`
- `WT_doc_imported`、`WT_doc_tree`、`WT_doc_content`
- `WT_requirement_saved`、`WT_saved_requirement_tree`、`WT_saved_requirement_content`
- `WT_data_template`
- `WT_perf_data_sources`、`WT_perf_data_source`、`WT_perf_history`

服务端接口不可用时，部分项目和测试任务数据会回退到浏览器存储。浏览器存储目前没有按项目 ID 完全隔离，清理浏览器数据可能导致本地页面状态丢失。

## 目录结构

```text
.
├── index.html          # 页面结构和各功能视图
├── app.js              # 前端业务逻辑
├── styles.css          # 页面样式
├── server.js           # Node.js 静态文件服务和 JSON API
├── projects.json       # 项目数据
├── test_tasks.json     # 测试任务数据
├── 操作步骤流程.md      # 详细操作流程
└── README.md           # 项目说明
```

## 开发说明

1. 修改前端代码后刷新浏览器即可查看效果；服务端以无缓存响应提供静态文件。
2. 项目和测试任务的 POST 接口会直接覆盖 JSON 文件，使用前请备份数据。
3. 项目密码和模型 API Key 当前以明文形式存储，仅适合本地演示或开发环境，不建议直接用于生产环境。
4. 如需接入真实 AI、测试执行引擎或性能数据源，需要在现有前端模拟逻辑之外增加后端服务、认证和数据校验。

详细的页面操作步骤请参阅 [操作步骤流程.md](操作步骤流程.md)。
