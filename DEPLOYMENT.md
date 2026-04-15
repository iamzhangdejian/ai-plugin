# 部署指南

## 本地开发调试

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

- 开发服务器会在 `http://localhost:3000` 启动
- 支持热重载（HMR）
- 源码修改后自动刷新

### 3. 本地构建测试

```bash
npm run build
```

构建输出到 `dist/` 目录：
```
dist/
├── ai-robot.js         # 库文件（ES 模块）
├── ai-robot.js.map     # Source map
└── index.html          # Demo 站点
```

### 4. 预览构建结果

```bash
# 使用 Vite 预览
npm run preview

# 或使用任意静态服务器
npx serve dist
```

---

## Cloudflare Pages 自动化部署

### 方式一：通过 Cloudflare Dashboard 连接 GitHub（推荐）

#### 步骤：

1. **登录 Cloudflare Dashboard**
   - 访问 [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages** 页面

2. **创建新项目**
   - 点击 **Create application**
   - 选择 **Pages** 标签
   - 点击 **Connect to Git**

3. **选择仓库**
   - 选择你的 GitHub 账号
   - 选择 `ai-robot-assistant` 仓库

4. **配置构建设置**
   ```
   Framework preset:  None
   Build command:     npm install && npm run build
   Build output:      dist
   Node version:      18
   ```

5. **部署**
   - 点击 **Save and Deploy**
   - 首次部署会自动触发
   - 部署完成后可在 Cloudflare Pages 域名访问

#### 配置截图说明：

- **Production branch**: `main`
- **Build command**: `npm install && npm run build`
- **Build output directory**: `dist`

---

### 方式二：使用 GitHub Actions

#### 1. 获取 Cloudflare 凭证

**获取 Account ID:**
1. 登录 Cloudflare Dashboard
2. 右侧边栏找到 **Account ID**
3. 复制 32 位字符串

**创建 API Token:**
1. 访问 [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. 点击 **Create Token**
3. 选择 **Create Custom Token**
4. 权限设置：
   - **Account.Cloudflare Pages** = `Edit`
   - **Account.Account Settings** = `Read`
5. 点击 **Continue to summary**
6. 复制生成的 Token（只显示一次）

#### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下 secrets：

   | Name | Value |
   |------|-------|
   | `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare Account ID |
   | `CLOUDFLARE_API_TOKEN` | 你创建的 API Token |

#### 3. 配置完成

- 推送代码到 `main` 分支会自动触发部署
- 查看部署状态：**Actions** → **Deploy to Cloudflare Pages**
- 部署成功后会生成预览 URL

---

### 方式三：手动部署（使用 Wrangler CLI）

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
# 或
pnpm add -g wrangler
```

#### 2. 登录 Cloudflare

```bash
wrangler login
```

会打开浏览器进行 OAuth 授权。

#### 3. 创建项目（首次部署）

```bash
# 先构建项目
npm run build

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=ai-robot-assistant
```

#### 4. 后续部署

```bash
npm run build
wrangler pages deploy dist
```

---

## 自定义域名

部署成功后，可以为项目配置自定义域名：

1. 进入 Cloudflare Pages 项目
2. 点击 **Custom domains**
3. 点击 **Add custom domain**
4. 输入你的域名（如 `robot.yourdomain.com`）
5. Cloudflare 会自动配置 DNS 和 SSL 证书

---

## 故障排查

### 构建失败：Cannot find module

确保 `node_modules` 正确安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 部署成功但页面空白

1. 打开浏览器开发者工具
2. 检查控制台错误
3. 确认 Three.js CDN 可访问：`https://cdnjs.cloudflare.com/ajax/libs/three.js/0.162.0/three.min.js`

### GitHub Actions 部署失败

1. 检查 Secrets 是否正确配置
2. 确认 API Token 权限足够（Pages: Edit）
3. 查看 Action 日志获取详细错误

### Cloudflare Pages 构建超时

- 默认超时为 10 分钟
- 可在项目设置中调整 **Build timeout**
- 优化建议：使用 `cache: 'npm'` 缓存依赖

---

## 环境变量

如需在构建时使用环境变量，可在以下位置配置：

### Cloudflare Pages 环境变量

1. 进入 Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加变量（支持 Production 和 Preview 环境）

### GitHub Actions 环境变量

在 `.github/workflows/deploy.yml` 中添加：

```yaml
env:
  API_ENDPOINT: https://api.example.com
```

---

## 项目结构

```
ai-plugin/
├── src/                      # 源代码
│   ├── index.ts              # 入口文件
│   ├── components/           # Web Components
│   ├── core/                 # 核心逻辑
│   └── utils/                # 工具函数
├── index.html                # Demo 页面
├── dist/                     # 构建输出（自动生成）
├── .github/workflows/        # GitHub Actions
├── package.json              # 项目配置
├── vite.config.ts            # Vite 配置
└── pages.toml                # Cloudflare Pages 配置
```

---

## 发布到 npm

项目同时支持发布到 npm：

```bash
# 更新版本号
npm version patch  # 或 minor / major

# 发布
npm publish
```

发布后用户可以通过 npm 安装：
```bash
npm install ai-robot-assistant
```
