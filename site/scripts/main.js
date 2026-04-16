/**
 * Main Entry - 主入口文件
 * AI Robot Assistant Demo Site
 */

// ==================== 工具函数 ====================

/**
 * 检查是否是刷新页面
 */
function isPageRefresh() {
  console.log('🔍 Checking page refresh... performance.navigation:', performance.navigation?.type);
  if (performance.navigation) {
    return performance.navigation.type === performance.navigation.TYPE_RELOAD;
  }
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      const navEntry = navEntries[0];
      return navEntry.type === 'reload';
    }
  } catch (e) {
    console.warn('Navigation API not available:', e);
  }
  return false;
}

// ==================== 状态管理 ====================

// API 配置状态
let isMockMode = true;
let apiConfig = {
  apiKey: '',
  apiEndpoint: ''
};

// ==================== 国际化 ====================

const translations = {
  zh: {
    'nav.home': '首页',
    'nav.features': '特性',
    'nav.usage': '使用方式',
    'nav.api': 'API 文档',
    'lang.current': '中文',
    'lang.zh': '简体中文',
    'lang.en': 'English',
    'nav.mock': 'Mock 模式',
    'api.config.title': '⚙️ API 配置',
    'api.config.desc': '配置 AI 后端服务，开启真实对话体验',
    'form.apiKey.placeholder': '请输入 API Key',
    'form.apiKey.hint': '🔐 您的 API Key 只会存储在本地',
    'form.apiEndpoint.placeholder': 'https://api.example.com/chat',
    'form.apiEndpoint.hint': '🌐 AI 服务的完整 URL 地址',
    'form.cancel': '✕ 取消',
    'form.save': '✓ 保存配置',
    'hero.badge': '✨ Web Components 驱动',
    'hero.title': 'AI Robot Assistant',
    'hero.desc': '一个可爱、治愈系的 3D AI 机器人助手浏览器插件<br>支持语音交互、自由拖拽和智能对话<br>可轻松集成到任意前端项目中',
    'hero.btn.interact': '💬 和我互动',
    'hero.btn.docs': '📖 查看文档',
    'hero.scroll': '向下滚动',
    'hero.robot.hint': '✨ 戳戳我开始聊天吧～',
    'features.title': '✨ 核心特性',
    'features.desc': '为现代 Web 应用打造的最佳 AI 助手体验',
    'features.f1.title': '3D 可爱机器人',
    'features.f1.desc': '基于 Three.js 的治愈系 3D 机器人形象，支持多种表情动画和状态反馈，让交互更有温度。',
    'features.f2.title': '语音双活',
    'features.f2.desc': '支持语音唤醒和语音对话，内置 Web Speech API，解放双手，自然交互。',
    'features.f3.title': '自由拖拽',
    'features.f3.desc': '支持鼠标/触摸拖拽，惯性吸附到页面边缘，位置随心而定。',
    'features.f4.title': '智能对话',
    'features.f4.desc': '自适应高度对话框，支持 Markdown 格式渲染，对话内容清晰易读。',
    'features.f5.title': '响应式设计',
    'features.f5.desc': '完美适配各种屏幕尺寸，从桌面到移动端，体验始终如一。',
    'features.f6.title': '跨框架兼容',
    'features.f6.desc': 'Web Components 封装，React / Vue / Angular / 原生 JS 均可无缝集成。',
    'features.f7.title': '多主题支持',
    'features.f7.desc': '内置蓝色、绿色、紫色三种主题，还可自定义颜色满足个性化需求。',
    'features.f8.title': '易于集成',
    'features.f8.desc': '简单的 API 设计，几行代码即可将机器人添加到你的项目中。',
    'usage.title': '🚀 快速开始',
    'usage.desc': '选择适合你的集成方式',
    'usage.webcomp.title': '🌐 Web Component',
    'usage.webcomp.desc': '推荐方式，声明式使用，最简单直观',
    'usage.jsapi.title': '⚡ JavaScript API',
    'usage.jsapi.desc': '编程式创建，更灵活的控制',
    'usage.react.title': '⚛️ React 组件',
    'usage.react.desc': '在 React 应用中完美融合',
    'usage.vue.title': '🟢 Vue 组件',
    'usage.vue.desc': '在 Vue 应用中轻松使用',
    'api.header': '📖 API 文档',
    'api.header.desc': '完整的配置选项和方法说明',
    'api.config.header': '配置选项',
    'api.table.param': '参数',
    'api.table.type': '类型',
    'api.table.default': '默认值',
    'api.table.desc': '说明',
    'api.config.apiKey.desc': 'AI API 密钥',
    'api.config.apiEndpoint.desc': 'AI API 端点 URL',
    'api.config.wakeWord.desc': '语音唤醒词',
    'api.config.theme.desc': '主题颜色',
    'api.config.position.desc': '初始位置',
    'api.config.voice.desc': '是否启用语音',
    'api.methods.header': '常用方法',
    'api.methods.table.method': '方法',
    'api.methods.table.param': '参数',
    'api.methods.table.return': '返回值',
    'api.methods.table.desc': '说明',
    'api.methods.send.desc': '发送消息并获取 AI 回复',
    'api.methods.setConfig.desc': '更新配置',
    'api.methods.show.desc': '控制机器人显示/隐藏',
    'api.methods.on.desc': '事件监听/移除',
    'api.methods.clearHistory.desc': '清空对话历史',
    'api.methods.getState.desc': '获取当前状态',
    'api.events.header': '事件类型',
    'api.events.table.event': '事件名',
    'api.events.table.param': '回调参数',
    'api.events.table.desc': '说明',
    'api.events.robotReady.desc': '机器人初始化完成',
    'api.events.stateChange.desc': '状态变化',
    'api.events.messageSent.desc': '消息已发送',
    'api.events.messageReceived.desc': '消息已接收',
    'footer.docs': '文档',
    'footer.examples': '示例',
    'footer.issues': 'Issues',
    'footer.copyright': '© 2025 AI Robot Assistant. MIT License'
  },
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.usage': 'Usage',
    'nav.api': 'API Docs',
    'lang.current': 'English',
    'lang.zh': '简体中文',
    'lang.en': 'English',
    'nav.mock': 'Mock Mode',
    'api.config.title': '⚙️ API Configuration',
    'api.config.desc': 'Configure AI backend service for real conversation experience',
    'form.apiKey.placeholder': 'Enter API Key',
    'form.apiKey.hint': '🔐 Your API Key is stored locally only',
    'form.apiEndpoint.placeholder': 'https://api.example.com/chat',
    'form.apiEndpoint.hint': '🌐 Complete URL of AI service',
    'form.cancel': '✕ Cancel',
    'form.save': '✓ Save Configuration',
    'hero.badge': '✨ Powered by Web Components',
    'hero.title': 'AI Robot Assistant',
    'hero.desc': 'A cute, healing 3D AI robot assistant browser plugin<br>Supports voice interaction, free drag-and-drop, and smart conversation<br>Easily integrate into any frontend project',
    'hero.btn.interact': '💬 Interact With Me',
    'hero.btn.docs': '📖 View Docs',
    'hero.scroll': 'Scroll Down',
    'hero.robot.hint': '✨ Tap me to chat~',
    'features.title': 'Core Features',
    'features.desc': 'Best AI Assistant Experience for Modern Web Applications',
    'features.f1.title': '3D Cute Robot',
    'features.f1.desc': 'Three.js based healing 3D robot with multiple expression animations and state feedback, making interaction more warm.',
    'features.f2.title': 'Voice Interaction',
    'features.f2.desc': 'Supports voice wake-up and conversation with built-in Web Speech API, hands-free natural interaction.',
    'features.f3.title': 'Free Drag',
    'features.f3.desc': 'Supports mouse/touch drag with inertia and edge snapping, position as you like.',
    'features.f4.title': 'Smart Chat',
    'features.f4.desc': 'Adaptive height dialog box with Markdown format rendering, clear and readable conversation content.',
    'features.f5.title': 'Responsive Design',
    'features.f5.desc': 'Perfect adaptation to various screen sizes, from desktop to mobile, consistent experience.',
    'features.f6.title': 'Cross-Framework Compatible',
    'features.f6.desc': 'Web Components encapsulation, seamless integration with React / Vue / Angular / vanilla JS.',
    'features.f7.title': 'Multi-Theme Support',
    'features.f7.desc': 'Built-in blue, green, purple three themes, or customize colors to meet personalized needs.',
    'features.f8.title': 'Easy Integration',
    'features.f8.desc': 'Simple API design, add the robot to your project with just a few lines of code.',
    'usage.title': '🚀 Quick Start',
    'usage.desc': 'Choose Your Integration',
    'usage.webcomp.title': '🌐 Web Component',
    'usage.webcomp.desc': 'Recommended approach, declarative usage, simplest and most intuitive',
    'usage.jsapi.title': '⚡ JavaScript API',
    'usage.jsapi.desc': 'Programmatic creation, more flexible control',
    'usage.react.title': '⚛️ React Component',
    'usage.react.desc': 'Seamless integration in React applications',
    'usage.vue.title': '🟢 Vue Component',
    'usage.vue.desc': 'Easy integration in Vue applications',
    'api.header': '📖 API Documentation',
    'api.header.desc': 'Complete configuration options and method descriptions',
    'api.config.header': 'Configuration Options',
    'api.table.param': 'Parameter',
    'api.table.type': 'Type',
    'api.table.default': 'Default',
    'api.table.desc': 'Description',
    'api.config.apiKey.desc': 'AI API Key',
    'api.config.apiEndpoint.desc': 'AI API Endpoint URL',
    'api.config.wakeWord.desc': 'Voice wake-up word',
    'api.config.theme.desc': 'Theme color',
    'api.config.position.desc': 'Initial position',
    'api.config.voice.desc': 'Enable voice features',
    'api.methods.header': 'Common Methods',
    'api.methods.table.method': 'Method',
    'api.methods.table.param': 'Parameters',
    'api.methods.table.return': 'Returns',
    'api.methods.table.desc': 'Description',
    'api.methods.send.desc': 'Send message and get AI response',
    'api.methods.setConfig.desc': 'Update configuration',
    'api.methods.show.desc': 'Show/hide robot',
    'api.methods.on.desc': 'Event listener add/remove',
    'api.methods.clearHistory.desc': 'Clear conversation history',
    'api.methods.getState.desc': 'Get current state',
    'api.events.header': 'Event Types',
    'api.events.table.event': 'Event',
    'api.events.table.param': 'Callback Params',
    'api.events.table.desc': 'Description',
    'api.events.robotReady.desc': 'Robot initialization complete',
    'api.events.stateChange.desc': 'State changed',
    'api.events.messageSent.desc': 'Message sent',
    'api.events.messageReceived.desc': 'Message received',
    'footer.docs': 'Docs',
    'footer.examples': 'Examples',
    'footer.issues': 'Issues',
    'footer.copyright': '© 2025 AI Robot Assistant. MIT License'
  }
};

/**
 * 应用翻译到页面
 */
function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.innerHTML = t[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.setAttribute('placeholder', t[key]);
    }
  });

  document.documentElement.lang = lang;
}

/**
 * 切换语言
 */
function switchLanguage(lang) {
  document.querySelectorAll('.nav-language-item').forEach(item => {
    item.classList.toggle('active', item.dataset.lang === lang);
  });

  document.getElementById('navLanguage')?.classList.remove('open');

  const langText = document.querySelector('.nav-language-text');
  if (langText) {
    langText.textContent = lang === 'zh' ? '中文' : 'English';
  }

  applyTranslations(lang);
  localStorage.setItem('ai-robot-lang', lang);

  window.dispatchEvent(new CustomEvent('ai-robot-locale-change', { detail: { locale: lang } }));
}

/**
 * 初始化语言
 */
function initLanguage() {
  const savedLang = localStorage.getItem('ai-robot-lang') || 'zh';
  switchLanguage(savedLang);
}

/**
 * 切换语言下拉菜单
 */
function toggleLanguageDropdown() {
  const langEl = document.getElementById('navLanguage');
  if (langEl) {
    langEl.classList.toggle('open');
  }
}

// ==================== API 配置管理 ====================

/**
 * 更新 Mock 模式指示器
 */
function updateMockIndicator() {
  const indicator = document.getElementById('mockIndicator');
  const dot = indicator?.querySelector('.mock-dot');

  if (isMockMode) {
    indicator?.classList.remove('active');
    if (dot) dot.style.background = '';
  } else {
    indicator?.classList.add('active');
    if (dot) dot.style.background = '';
  }
}

/**
 * 更新机器人配置
 */
function updateRobotConfig() {
  const robot = document.getElementById('robot');
  if (robot) {
    if (isMockMode) {
      robot.setAttribute('api-key', '');
      robot.setAttribute('api-endpoint', '');
      if (typeof robot.setConfig === 'function') {
        robot.setConfig({ apiKey: '', apiEndpoint: '' });
      }
    } else {
      robot.setAttribute('api-key', apiConfig.apiKey);
      robot.setAttribute('api-endpoint', apiConfig.apiEndpoint);
      if (typeof robot.setConfig === 'function') {
        robot.setConfig({
          apiKey: apiConfig.apiKey,
          apiEndpoint: apiConfig.apiEndpoint
        });
      }
    }
    console.log('🤖 Robot config updated:', {
      mode: isMockMode ? 'mock' : 'api',
      apiKey: apiConfig.apiKey ? '***' : '(empty)',
      apiEndpoint: apiConfig.apiEndpoint || '(empty)'
    });
  }
}

/**
 * 显示状态消息
 */
function showStatus(message, type) {
  const statusEl = document.getElementById('statusMessage');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + type;
  }
}

/**
 * 隐藏状态消息
 */
function hideStatus() {
  const statusEl = document.getElementById('statusMessage');
  if (statusEl) {
    statusEl.className = 'status-message';
    statusEl.textContent = '';
  }
}

/**
 * 初始化 API 配置
 */
function initApiConfig() {
  const saved = localStorage.getItem('ai-robot-config');
  if (saved) {
    try {
      apiConfig = JSON.parse(saved);
      if (apiConfig.apiKey && apiConfig.apiEndpoint) {
        isMockMode = false;
        updateMockIndicator();
        updateRobotConfig();
      }
    } catch (e) {
      console.error('Failed to load saved config:', e);
    }
  }
  updateMockIndicator();
}

/**
 * 切换 API 配置弹窗
 */
function toggleApiConfig() {
  if (isMockMode) {
    openApiConfig();
  } else {
    if (confirm('确定要切换回 Mock 模式吗？切换后机器人将使用模拟数据。')) {
      isMockMode = true;
      updateMockIndicator();
      updateRobotConfig();
      showStatus('已切换回 Mock 模式', 'success');
    }
  }
}

/**
 * 打开 API 配置弹窗
 */
function openApiConfig() {
  const overlay = document.getElementById('apiConfigOverlay');
  const apiKeyInput = document.getElementById('apiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');

  if (apiKeyInput) apiKeyInput.value = apiConfig.apiKey || '';
  if (apiEndpointInput) apiEndpointInput.value = apiConfig.apiEndpoint || '';

  overlay?.classList.add('visible');

  setTimeout(() => {
    apiKeyInput?.focus();
  }, 100);
}

/**
 * 关闭 API 配置弹窗
 */
function closeApiConfig() {
  const overlay = document.getElementById('apiConfigOverlay');
  overlay?.classList.remove('visible');
  hideStatus();
}

/**
 * 保存 API 配置
 */
function saveApiConfig(event) {
  event.preventDefault();

  const apiKeyInput = document.getElementById('apiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');

  const apiKey = apiKeyInput?.value?.trim() || '';
  const apiEndpoint = apiEndpointInput?.value?.trim() || '';

  if (!apiKey) {
    showStatus('❌ 请输入 API Key', 'error');
    apiKeyInput?.focus();
    return;
  }

  if (!apiEndpoint) {
    showStatus('❌ 请输入 API Endpoint', 'error');
    apiEndpointInput?.focus();
    return;
  }

  try {
    new URL(apiEndpoint);
  } catch (e) {
    showStatus('❌ 请输入有效的 URL 地址', 'error');
    apiEndpointInput?.focus();
    return;
  }

  apiConfig = { apiKey, apiEndpoint };
  localStorage.setItem('ai-robot-config', JSON.stringify(apiConfig));

  isMockMode = false;
  updateMockIndicator();
  updateRobotConfig();

  showStatus('✅ 配置已保存，已切换到 API 模式', 'success');

  setTimeout(() => {
    closeApiConfig();
  }, 1500);
}

// ==================== 机器人交互 ====================

/**
 * 激活机器人
 */
function activateRobot() {
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const robot = document.getElementById('robot');
  if (robot && typeof robot.showHintBubble === 'function') {
    robot.showHintBubble();
  }
}

/**
 * 设置机器人事件监听
 */
function setupRobotEvents() {
  const robot = document.getElementById('robot');

  // 监听 robot-ready 事件
  const handleRobotReady = () => {
    console.log('🤖 Robot is ready!');
    // 启动定时互动效果
    startRobotHintInterval();
  };

  // 同时监听两种事件来源
  if (robot) {
    robot.addEventListener('robot-ready', handleRobotReady);
  }
  window.addEventListener('ai-robot-ready', handleRobotReady);

  // 如果机器人已经就绪（事件可能已经触发），延迟启动
  if (robot && typeof robot.showHintBubble === 'function') {
    setTimeout(() => {
      console.log('🤖 Robot already ready, starting interval...');
      startRobotHintInterval();
    }, 500);
  }

  robot?.addEventListener('message-sent', (e) => {
    console.log('📤 Message sent:', e.detail);
  });

  robot?.addEventListener('message-received', (e) => {
    console.log('📥 Message received:', e.detail);
  });
}

/**
 * 启动定时互动效果
 */
let robotHintInterval = null;
function startRobotHintInterval() {
  // 每 5 秒触发一次互动效果
  robotHintInterval = setInterval(() => {
    // 检查页面是否可见
    if (document.visibilityState === 'visible') {
      const robot = document.getElementById('robot');
      if (robot && typeof robot.showHintBubble === 'function') {
        robot.showHintBubble();
      }
    }
  }, 5000);
}

/**
 * 停止定时互动效果
 */
function stopRobotHintInterval() {
  if (robotHintInterval) {
    clearInterval(robotHintInterval);
    robotHintInterval = null;
  }
}

// ==================== 页面刷新处理 ====================

/**
 * 处理页面刷新
 */
function handlePageRefresh() {
  const isRefreshing = isPageRefresh();
  if (isRefreshing) {
    console.log('🔄 Page refresh detected');
    window.scrollTo(0, 0);
    document.documentElement.setAttribute('data-ai-robot-reset', 'true');
  } else {
    console.log('✅ Normal page load');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (isPageRefresh()) {
        window.scrollTo(0, 0);
        document.documentElement.setAttribute('data-ai-robot-reset', 'true');
      }
    });
  }
}

// ==================== 初始化 ====================

/**
 * 初始化所有功能
 */
function init() {
  // 处理页面刷新
  handlePageRefresh();

  // 初始化语言
  initLanguage();

  // 初始化 API 配置
  initApiConfig();

  // 设置机器人事件监听
  setupRobotEvents();

  // 监听页面可见性变化，控制定时器
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopRobotHintInterval();
    } else {
      startRobotHintInterval();
    }
  });

  // 点击外部关闭语言下拉菜单
  document.addEventListener('click', (e) => {
    const langEl = document.getElementById('navLanguage');
    if (langEl && !langEl.contains(e.target)) {
      langEl.classList.remove('open');
    }
  });

  // 点击遮罩关闭 API 配置弹窗
  document.getElementById('apiConfigOverlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('apiConfigOverlay')) {
      closeApiConfig();
    }
  });

  // 暴露全局函数供 HTML 调用
  window.toggleLanguageDropdown = toggleLanguageDropdown;
  window.switchLanguage = switchLanguage;
  window.toggleApiConfig = toggleApiConfig;
  window.saveApiConfig = saveApiConfig;
  window.activateRobot = activateRobot;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
