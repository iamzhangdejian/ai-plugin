# 3D 机器人显示问题诊断指南

## 问题现象
Cloudflare Pages 上 3D 机器人没有正常显示

## 可能原因和解决方案

### 1. 构建文件未正确部署

**检查步骤：**
1. 登录 Cloudflare Dashboard
2. 进入 Pages 项目
3. 查看最新部署的详细信息
4. 检查构建日志中是否有错误

**解决方案：**
```bash
# 本地重新构建
npm run build

# 验证输出
ls -la dist/
# 应该看到：
# - ai-robot.js (约 1MB)
# - ai-robot.js.map (约 2.2MB)
# - index.html

# 推送到 GitHub 触发重新部署
git add .
git commit -m "Rebuild for Cloudflare Pages"
git push origin main
```

### 2. 浏览器缓存问题

**检查步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 检查 `ai-robot.js` 是否成功加载（状态码 200）

**解决方案：**
- 使用无痕模式访问
- 或强制刷新：`Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- 或在 Cloudflare Dashboard 清除缓存

### 3. JavaScript 错误

**检查步骤：**
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 刷新页面
4. 查看是否有红色错误信息

**常见错误：**
- `WebGL context lost` - 浏览器不支持 WebGL
- `Failed to load module` - 文件加载失败
- `AIRobot is not defined` - 库文件未正确加载

### 4. WebGL 不支持

**检查步骤：**
1. 访问 https://get.webgl.org/
2. 查看是否显示旋转的立方体

**解决方案：**
- 更新浏览器到最新版本
- 确保显卡驱动已更新
- 检查浏览器设置中 WebGL 已启用

### 5. CSP（内容安全策略）问题

**检查步骤：**
1. 打开浏览器开发者工具
2. 查看 Console 中是否有 CSP 相关错误

**解决方案：**
在 Cloudflare Pages 项目中添加以下配置：

创建 `.github/workflows/deploy.yml` 的部署配置时，添加自定义头：

```yaml
# 在 Cloudflare Pages 项目设置中配置
# Settings -> Functions -> Custom headers
```

或者在 `wrangler.toml` 中添加：
```toml
[[headers]]
for = "/*"
[headers.values]
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:;"
```

### 6. 容器尺寸问题

**检查步骤：**
1. 打开浏览器开发者工具
2. 检查 `#hero-robot-container` 的尺寸
3. 确认宽度和高度不为 0

**解决方案：**
确保 CSS 样式正确：
```css
#hero-robot-container {
  width: 100%;
  height: 300px; /* 或固定高度 */
}

#hero-robot-container ai-robot {
  display: block;
  width: 270px;
  height: 270px;
}
```

### 7. 初始化时机问题

**检查步骤：**
1. 打开 Console
2. 查看是否有以下日志：
   - `[AIRobotElement] Initializing with config`
   - `[AI Robot] Web Component registered`
   - `🤖 Robot is ready!`

**解决方案：**
如果没有任何日志，可能是脚本加载顺序问题。检查 HTML 中：
```html
<script type="module" src="/ai-robot.js"></script>
```
是否在 `</body>` 之前。

### 8. Cloudflare Pages 配置问题

**检查步骤：**
1. 进入 Cloudflare Pages 项目
2. Settings -> Build & deployments
3. 检查配置：
   - Build command: `npm install && npm run build`
   - Build output directory: `dist`
   - Node version: `18`

**解决方案：**
如果配置不正确，点击 "Edit" 修改并重新部署。

## 快速诊断脚本

在浏览器 Console 中运行以下代码：

```javascript
// 检查 WebGL 支持
console.log('WebGL 支持：', (function() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch(e) { return false; }
})());

// 检查 AIRobot 是否加载
console.log('AIRobot 已加载:', typeof AIRobot !== 'undefined');

// 检查 ai-robot 元素是否注册
console.log('ai-robot 已注册:', !!customElements.get('ai-robot'));

// 检查机器人实例
const robot = document.getElementById('robot');
console.log('机器人元素:', robot);
console.log('机器人已初始化:', robot?.initialized);
```

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：
1. 浏览器 Console 完整输出
2. Network 标签中 `ai-robot.js` 的加载状态
3. Cloudflare Pages 部署日志
4. 使用的浏览器版本和操作系统
