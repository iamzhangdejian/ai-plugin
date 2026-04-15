# 快速开始指南

## 项目结构

```
ai-plugin/
├── src/                      # 源代码目录
│   ├── index.ts              # 库入口文件
│   ├── components/           # Web Components 组件
│   ├── core/                 # 核心逻辑
│   └── utils/                # 工具函数
├── index.html                # Demo 页面（开发用）
├── dist/                     # 构建输出目录
│   ├── ai-robot.js           # 库文件
│   ├── ai-robot.js.map       # Source map
│   └── index.html            # Demo 站点（部署用）
├── scripts/
│   └── build-site.js         # 构建脚本
├── .github/workflows/
│   └── deploy.yml            # GitHub Actions 部署
├── pages.toml                # Cloudflare Pages 配置
├── vite.config.ts            # Vite 配置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 命令说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 构建生产版本（输出到 dist/） |
| `npm run build:lib` | 仅构建库文件 |
| `npm run build:site` | 生成 Demo 站点到 dist/ |
| `npm run preview` | 预览构建结果 |
| `npm run typecheck` | TypeScript 类型检查 |

## 本地开发流程

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

- 自动打开浏览器（http://localhost:3000）
- 支持热重载（HMR）
- 源码修改后自动刷新

### 3. 构建生产版本

```bash
npm run build
```

输出到 `dist/` 目录：
- `ai-robot.js` - 可发布的库文件
- `index.html` - 可部署的 Demo 站点

## 部署到 Cloudflare Pages

### 方式一：Cloudflare Dashboard（推荐）

1. 访问 [Cloudflare Pages](https://dash.cloudflare.com/?to=%2F%3Aaccount%2Fpages)
2. 点击 **Create application**
3. 选择 **Connect to Git**
4. 选择仓库 `ai-robot-assistant`
5. 配置构建设置：
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
   - **Node version**: `18`
6. 点击 **Save and Deploy**

### 方式二：GitHub Actions

1. 在 Cloudflare Dashboard 获取：
   - Account ID
   - API Token（Pages: Edit 权限）

2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

3. 推送代码到 main 分支自动部署

### 方式三：手动部署

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录
wrangler login

# 构建
npm run build

# 部署
wrangler pages deploy dist
```

## 配置说明

### Vite 配置 (vite.config.ts)

- 构建模式：Library (ES 模块)
- 入口文件：`src/index.ts`
- 输出目录：`dist/`
- 外部依赖：`three`
- 开发服务器端口：3000

### 构建脚本 (scripts/build-site.js)

- 复制 `index.html` 到 `dist/`
- 替换脚本引用：`/src/index.ts` → `/ai-robot.js`
- 添加 Three.js CDN 引用

### Cloudflare 配置 (pages.toml)

```toml
[build]
command = "npm install && npm run build"
publish = "dist"

[build.environment]
NODE_VERSION = "18"
```

## 环境变量

如需使用环境变量，在 Cloudflare Pages 项目设置中配置：
- Settings → Environment variables
- 支持 Production 和 Preview 环境

## 发布到 npm

```bash
# 更新版本
npm version patch  # 或 minor / major

# 发布
npm publish
```

## 故障排查

### 构建失败

```bash
# 清理缓存
rm -rf node_modules dist package-lock.json

# 重新安装
npm install

# 重新构建
npm run build
```

### 页面空白

1. 检查浏览器控制台错误
2. 确认 Three.js CDN 可访问
3. 检查 CSP 设置

### GitHub Actions 失败

1. 检查 Secrets 配置
2. 查看 Action 日志
3. 确认 API Token 权限

## 更多文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细部署指南
- [README.md](./README.md) - 项目说明和 API 文档
