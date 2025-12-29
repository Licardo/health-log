这是一个为你量身定制的 `README.md` 文档。它是按照**“写给未来的 AI 或开发者看”**的标准撰写的。

你可以将以下内容保存为项目根目录下的 `README.md` 文件。下次如果你需要大模型帮你加功能，只需把这个文档贴给它，它就能瞬间理解整个项目架构。

---

# 🏥 Personal Health Hub (个人健康中台)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

这是一个基于 **Serverless 架构** 的轻量级个人健康管理 H5 应用。它将前端部署在 Vercel，通过 Vercel Functions 作为后端代理，使用 **Notion Database** 作为无头 CMS (Headless CMS) 存储所有健康数据。

## 🛠 技术栈 (Tech Stack)

*   **Frontend (单页应用):**
    *   **HTML5 / ES6+**: 原生开发，无构建步骤 (No Build Step)。
    *   **Vue.js 3**: 使用 Global Build (CDN 引入)，采用 Composition API 写法。
    *   **Tailwind CSS**: 通过 CDN 引入，负责所有 UI 样式 (Utility-first)。
    *   **FontAwesome**: 图标库。
*   **Backend (Serverless):**
    *   **Vercel Functions**: Node.js 运行环境。
    *   **@notionhq/client**: Notion 官方 SDK。
*   **Database:**
    *   **Notion**: 两个核心数据库 (Logs & Configs)。

## ✨ 核心功能 (Features)

1.  **💊 日常补剂 (Supplements)**
    *   **打卡系统**: 每日追踪补剂服用情况，支持勾选/取消（云端同步）。
    *   **配置管理**: 支持增删改补剂清单（名称、剂量、服用时间），数据存储在 Notion 独立库。
    *   **历史热力图**: 可视化展示过去 30 天的打卡频率（基于真实历史数据）。
2.  **💊 用药记录 (Medications)**
    *   **快速录入**: 记录突发性用药（药品名 + 症状/原因）。
    *   **历史档案**: 支持修改、删除（归档）和搜索历史记录。
3.  **🩺 定期检查 (Health Plans)**
    *   **全景时间轴**: 统一展示未来计划 (Upcoming) 和 历史归档 (History)。
    *   **计划管理**: 新增、修改检查计划，支持不同类型（年度、季度、牙科等）颜色区分。
    *   **结果归档**: 完成检查后录入结果摘要，自动归档并变更为实线连接。
4.  **📱 UI/UX**
    *   **响应式设计**: 完美适配移动端（全屏 App 体验 + 底部导航）和 桌面端（侧边栏 + 宽屏布局）。
    *   **乐观更新 (Optimistic UI)**: 操作即时反馈，后台异步同步，体验丝滑。

---

## ⚙️ 数据库配置 (Notion Schema)

项目依赖两个 Notion 数据库。**必须严格按照以下字段名称和类型配置**，否则 API 会报错。

### 1. 补剂配置库 (Supplement Configs)
*用于存储“我要吃哪些药”的静态配置。*

| 字段名 (Property Name) | 类型 (Type) | 说明 |
| :--- | :--- | :--- |
| **Name** | Title | 补剂名称 (Primary Key) |
| **Dosage** | Rich Text | 剂量 (如: 500mg) |
| **Time** | Select | 选项: `早晨`, `午餐`, `晚餐`, `睡前` |
| **Active** | Checkbox | 标记是否启用 (软删除用) |

### 2. 健康日志库 (Health Logs)
*用于存储所有的动态记录：补剂打卡、生病吃药、体检计划。*

| 字段名 (Property Name) | 类型 (Type) | 关键选项/说明 |
| :--- | :--- | :--- |
| **Name** | Title | 记录名称 (药名或检查项) |
| **Date** | Date | 记录发生的日期 (ISO YYYY-MM-DD) |
| **Category** | Select | **核心字段**，选项必须包含:<br>1. `✅ 补剂打卡`<br>2. `💊 临时用药`<br>3. `🩺 定期检查` |
| **Status** | Select | 选项: `Pending` (待办), `Done` (已完成) |
| **Type** | Select | 选项: `Annual`, `Quarterly`, `Dental`, `Other` |
| **Result** | Rich Text | 检查结果摘要或用药症状备注 |

---

## 🚀 部署教程 (Deployment)

### 1. Notion 准备工作
1.  去 [Notion Integrations](https://www.notion.so/my-integrations) 创建一个新的 Integration，获取 `Internal Integration Token` (以 `ntn_` 开头)。
2.  在 Notion 中打开上述两个数据库，分别点击右上角 `...` -> `Connect to` -> 选择你的机器人。**这一步至关重要，否则 API 无法读写。**
3.  获取两个数据库的 ID (URL 中 `notion.so/` 和 `?v=` 之间的 32 位字符)。

### 2. 本地开发 (Local Development)
```bash
# 1. 克隆项目或创建目录
mkdir my-health-log && cd my-health-log

# 2. 初始化并安装依赖
npm init -y
npm install @notionhq/client

# 3. 创建环境变量文件 .env
echo "NOTION_KEY=ntn_你的密钥" >> .env
echo "NOTION_CONFIG_DB_ID=你的配置库ID" >> .env
echo "NOTION_LOGS_DB_ID=你的日志库ID" >> .env

# 4. 启动本地服务 (需要安装 Vercel CLI: npm i -g vercel)
vercel dev
```

### 3. 上线 Vercel (Production)
1.  将代码推送到 GitHub。
2.  在 Vercel Dashboard 导入项目。
3.  在 **Settings -> Environment Variables** 中填入以下变量：
    *   `NOTION_KEY`
    *   `NOTION_CONFIG_DB_ID`
    *   `NOTION_LOGS_DB_ID`
4.  部署后，建议绑定独立域名以获得国内最佳访问体验。

---

## 📡 API 文档 (Backend Reference)

所有 API 均位于 `/api` 目录下，由 Vercel Functions 托管。

### `GET /api/supplements`
*   **功能**: 获取当前启用的补剂配置列表。
*   **返回**: JSON 数组。

### `POST /api/supplements`
*   **功能**: 管理配置。
*   **Body**:
    *   `action`: `'create'` 或 `'delete'`
    *   `id`: (删除时需要) Notion Page ID
    *   `name`, `dosage`, `time`: (创建时需要)

### `GET /api/logs`
*   **参数**:
    *   `category`: 筛选类别 (如 `💊 临时用药`)
    *   `date`: 筛选具体日期 (YYYY-MM-DD)
    *   `limit`: 限制返回条数 (默认 50，热力图用 100)
*   **返回**: 格式化后的日志列表。

### `POST /api/logs`
*   **功能**: 创建新日志 (打卡、用药、检查)。
*   **Body**: `{ name, date, category, status, type, result }`

### `PUT /api/logs`
*   **功能**: 更新现有日志。
*   **Body**: `{ id, ...需要更新的字段 }`

### `DELETE /api/logs`
*   **功能**: 归档日志 (软删除)。
*   **Body**: `{ id }`

---

## 🔮 维护与扩展指南 (For AI Assistants)

如果你是负责维护此项目的 AI 助手，请遵循以下逻辑：

1.  **修改 UI**: 所有前端逻辑都在 `index.html` 的 `<script>` 标签内。使用了 Vue 3 Composition API 风格。
    *   *注意*: 修改 CSS 时优先使用 Tailwind 类名，不要写内联 style。
2.  **修改字段**: 如果需要增加新的记录字段（如“花费金额”）：
    *   第一步：在 Notion 数据库添加 `Cost` (Number) 字段。
    *   第二步：修改 `api/logs.js`，在 `properties` 对象中映射该字段。
    *   第三步：修改 `index.html` 中的表单和列表渲染。
3.  **调试**:
    *   后端日志通过 `console.log` 输出，可以在 Vercel Dashboard -> Logs 中查看。
    *   前端报错请通过浏览器 F12 Network 面板查看 API 响应。

---

## 📄 目录结构
```text
/
├── api/
│   ├── logs.js           # 核心业务逻辑 (CRUD)
│   └── supplements.js    # 配置管理逻辑
├── index.html            # 前端入口 (Vue + Tailwind)
├── package.json          # 依赖定义
└── vercel.json           # (可选) Vercel 配置文件
```