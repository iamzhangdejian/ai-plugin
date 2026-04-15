# AI Robot Assistant

一个可爱、治愈系的 3D AI 机器人助手浏览器插件，基于 Web Components 构建，可轻松集成到任意前端项目中。

## ✨ 核心特性

- 🎨 **3D 可爱机器人** - 基于 Three.js 的治愈系 3D 机器人形象，支持多种表情动画和状态反馈
- 🎤 **语音双活** - 支持语音唤醒和语音对话，内置 Web Speech API
- ✋ **自由拖拽** - 支持鼠标/触摸拖拽，惯性吸附到页面边缘
- 💬 **智能对话** - 自适应高度对话框，支持 Markdown 格式渲染
- 📱 **响应式设计** - 完美适配各种屏幕尺寸
- 🔌 **跨框架兼容** - React / Vue / Angular / 原生 JS 均可无缝集成
- 🎨 **多主题支持** - 内置蓝色、绿色、紫色三种主题

## 🚀 快速开始

### 安装

```bash
npm install ai-robot-assistant
```

### Web Component 方式

```html
<ai-robot
  api-key="your-api-key"
  api-endpoint="https://api.example.com/chat"
  wake-word="嗨小智"
  theme="blue"
></ai-robot>
```

### JavaScript API 方式

```javascript
import AIRobot from 'ai-robot-assistant';

const robot = AIRobot.create(document.body, {
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.example.com/chat',
  wakeWord: '嗨小智',
});
```

### React 组件

```jsx
import { useEffect, useRef } from 'react';
import 'ai-robot-assistant';

function App() {
  const robotRef = useRef(null);

  useEffect(() => {
    robotRef.current?.on('message-received', handleMsg);
  }, []);

  return <ai-robot ref={robotRef} />;
}
```

### Vue 组件

```vue
<template>
  <ai-robot ref="robotRef" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'ai-robot-assistant';

const robotRef = ref(null);

onMounted(() => {
  robotRef.value?.on('message-received', handleMsg);
});
</script>
```

## 📖 API 文档

### 配置选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| apiKey | string | '' | AI API 密钥 |
| apiEndpoint | string | '' | AI API 端点 URL |
| wakeWord | string | '嗨小智' | 语音唤醒词 |
| theme | 'blue' \| 'green' \| 'purple' | 'blue' | 主题颜色 |
| position | 'left' \| 'right' | 'right' | 初始位置 |
| voice.enabled | boolean | true | 是否启用语音 |

### 常用方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| send() | message: string | Promise<string> | 发送消息并获取 AI 回复 |
| setConfig() | config: object | void | 更新配置 |
| show() / hide() | - | void | 控制机器人显示/隐藏 |
| on() / off() | event, callback | void | 事件监听/移除 |
| clearHistory() | - | void | 清空对话历史 |
| getState() | - | RobotState | 获取当前状态 |

### 事件类型

| 事件名 | 回调参数 | 说明 |
|--------|----------|------|
| robot-ready | - | 机器人初始化完成 |
| state-change | { from, to } | 状态变化 |
| message-sent | Message | 消息已发送 |
| message-received | Message | 消息已接收 |

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run typecheck
```

## 📦 部署

### 本地构建

```bash
npm run build
```

构建输出到 `dist/` 目录，包含：
- `ai-robot.js` - 库文件
- `index.html` - Demo 站点

### Cloudflare Pages 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速开始：
1. 在 Cloudflare Dashboard 创建 Pages 项目
2. 连接 GitHub 仓库
3. 配置构建命令：`npm install && npm run build`
4. 配置输出目录：`dist`

## 📄 许可证

MIT License © 2024 AI Robot Assistant
