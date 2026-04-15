# AI Robot Assistant - 使用示例

## 快速开始

### 1. 基础用法（HTML 页面）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Robot Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .container {
      text-align: center;
      color: white;
    }
    
    h1 { font-size: 3rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; }
    
    .btn {
      display: inline-block;
      margin-top: 20px;
      padding: 15px 30px;
      background: white;
      color: #667eea;
      border-radius: 30px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      font-size: 1rem;
      transition: transform 0.2s;
    }
    
    .btn:hover { transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 AI Robot Assistant</h1>
    <p>点击下面的按钮激活机器人助手</p>
    <button class="btn" onclick="toggleRobot()">激活机器人</button>
  </div>

  <!-- AI Robot Web Component -->
  <ai-robot
    wake-word="嗨小智"
    theme="blue"
    visible="false"
  ></ai-robot>

  <script type="module">
    import 'ai-robot-assistant';

    function toggleRobot() {
      const robot = document.querySelector('ai-robot');
      const isVisible = robot.getAttribute('visible') !== 'false';
      robot.setAttribute('visible', !isVisible);
    }

    // 监听事件
    document.addEventListener('ai-robot-ready', (e) => {
      console.log('机器人已就绪:', e.detail);
    });
  </script>
</body>
</html>
```

### 2. React 集成

```jsx
import { useEffect, useRef } from 'react';
import 'ai-robot-assistant';

function App() {
  const robotRef = useRef(null);

  useEffect(() => {
    const robot = robotRef.current;
    
    // 监听消息事件
    robot?.on('message-sent', (e) => {
      console.log('发送消息:', e.detail);
    });

    robot?.on('message-received', (e) => {
      console.log('收到回复:', e.detail);
    });

    return () => {
      robot?.destroy();
    };
  }, []);

  const handleToggle = () => {
    const robot = robotRef.current;
    robot?.toggle();
  };

  return (
    <div className="App">
      <h1>我的 AI 助手</h1>
      <button onClick={handleToggle}>开关机器人</button>
      
      <ai-robot
        ref={robotRef}
        api-key="your-api-key"
        api-endpoint="https://api.example.com/chat"
        wake-word="你好助手"
        theme="blue"
      />
    </div>
  );
}

export default App;
```

### 3. Vue 3 集成

```vue
<template>
  <div class="app">
    <h1>我的 AI 助手</h1>
    <button @click="toggleRobot">开关机器人</button>
    
    <ai-robot
      ref="robotRef"
      wake-word="你好助手"
      theme="blue"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import 'ai-robot-assistant';

const robotRef = ref(null);

onMounted(() => {
  robotRef.value?.on('message-received', (e) => {
    console.log('收到消息:', e.detail);
  });
});

onUnmounted(() => {
  robotRef.value?.destroy();
});

const toggleRobot = () => {
  robotRef.value?.toggle();
};
</script>
```

### 4. JavaScript API 用法

```javascript
import AIRobot from 'ai-robot-assistant';

// 创建机器人实例
const robot = AIRobot.create(document.body, {
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.example.com/chat',
  wakeWord: '你好助手',
  theme: 'blue',
  position: 'right',
  voice: {
    enabled: true,
    language: 'zh-CN',
    rate: 1.0,
    pitch: 1.0,
  },
});

// 监听事件
robot.on('robot-ready', () => {
  console.log('机器人已就绪');
});

robot.on('message-sent', (e) => {
  console.log('消息已发送:', e.detail);
});

robot.on('message-received', (e) => {
  console.log('消息已接收:', e.detail);
});

// 控制方法
robot.show();
robot.hide();
robot.toggle();

// 发送消息
const reply = await robot.send('你好！');
console.log('AI 回复:', reply);

// 语音功能
robot.speak('你好，我是你的 AI 助手！');
robot.startListening();
robot.stopListening();

// 配置管理
robot.setConfig({ theme: 'green' });
const config = robot.getConfig();

// 对话管理
robot.addMessage('你好！', 'user');
robot.addMessage('你好！', 'assistant');
robot.clearHistory();
const history = robot.getHistory();

// 销毁
robot.destroy();
```

### 5. 自定义 AI 后端

```javascript
// 使用 OpenAI API
const robot = AIRobot.create(document.body, {
  apiKey: 'sk-your-openai-key',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
});

// 使用自定义后端
const robot = AIRobot.create(document.body, {
  apiKey: 'your-api-key',
  apiEndpoint: 'https://your-backend.com/api/chat',
});
```

### 6. 主题切换

```javascript
const robot = document.querySelector('ai-robot');

// 蓝色主题（默认）
robot.setTheme('blue');

// 绿色主题
robot.setTheme('green');

// 紫色主题
robot.setTheme('purple');
```

## 事件列表

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| `robot-ready` | 机器人初始化完成 | - |
| `state-change` | 状态变化 | `{ from, to }` |
| `message-sent` | 消息已发送 | `Message` |
| `message-received` | 消息已接收 | `Message` |
| `visibility-change` | 可见性变化 | `{ visible }` |

## 状态说明

- `idle` - 待机状态
- `dragging` - 拖拽中
- `listening` - 语音监听中
- `thinking` - 思考中
- `speaking` - 说话中
- `hidden` - 隐藏状态
