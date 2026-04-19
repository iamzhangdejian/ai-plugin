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
    'nav.settings': '设置',
    'lang.current': '中文',
    'lang.zh': '简体中文',
    'lang.en': 'English',
    'api.config.title': '⚙️ 设置',
    'api.config.desc': '选择对话模式',
    'settings.mode.mock': 'Mock 模式',
    'settings.mode.mock.desc': '使用模拟数据，无需 API 配置',
    'settings.mode.mock.confirm': '✓ 确认使用',
    'settings.mode.api': 'API 模式',
    'settings.mode.api.desc': '配置 AI 后端服务，真实对话体验',
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
    'footer.copyright': '© 2026 AI Robot Assistant. MIT License'
  },
  en: {
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.usage': 'Usage',
    'nav.api': 'API Docs',
    'nav.settings': 'Settings',
    'lang.current': 'English',
    'lang.zh': '简体中文',
    'lang.en': 'English',
    'api.config.title': '⚙️ Settings',
    'api.config.desc': 'Select conversation mode',
    'settings.mode.mock': 'Mock Mode',
    'settings.mode.mock.desc': 'Use simulated data, no API configuration needed',
    'settings.mode.mock.confirm': '✓ Confirm',
    'settings.mode.api': 'API Mode',
    'settings.mode.api.desc': 'Configure AI backend service for real conversation',
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
    'footer.copyright': '© 2026 AI Robot Assistant. MIT License'
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
  // 获取当前语言
  const currentLang = localStorage.getItem('ai-robot-lang') || 'zh';

  // 如果语言和当前已保存的相同，只关闭下拉框
  if (lang === currentLang) {
    document.getElementById('navLanguage')?.classList.remove('open');
    return;
  }

  // 更新激活状态
  document.querySelectorAll('.nav-language-item').forEach(item => {
    item.classList.toggle('active', item.dataset.lang === lang);
  });

  // 关闭下拉框
  document.getElementById('navLanguage')?.classList.remove('open');

  // 更新语言按钮文本
  const langText = document.querySelector('.nav-language-text');
  if (langText) {
    langText.textContent = lang === 'zh' ? '中文' : 'English';
  }

  // 保存到 localStorage
  localStorage.setItem('ai-robot-lang', lang);

  // 等待动画完成后刷新页面
  setTimeout(() => {
    window.location.reload();
  }, 250);
}

/**
 * 初始化语言
 */
function initLanguage() {
  const savedLang = localStorage.getItem('ai-robot-lang') || 'zh';

  // 设置语言按钮文本
  const langText = document.querySelector('.nav-language-text');
  if (langText) {
    langText.textContent = savedLang === 'zh' ? '中文' : 'English';
  }

  // 设置下拉框激活状态
  document.querySelectorAll('.nav-language-item').forEach(item => {
    item.classList.toggle('active', item.dataset.lang === savedLang);
  });

  // 应用翻译
  applyTranslations(savedLang);
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

/**
 * 切换移动端菜单
 */
function toggleMobileMenu() {
  const menu = document.getElementById('navMobileMenu');
  const toggle = document.querySelector('.nav-mobile-toggle');
  if (menu) {
    menu.classList.toggle('open');
  }
  if (toggle) {
    toggle.classList.toggle('open');
  }
}

// 暴露到全局作用域（因为使用了 type="module"）
window.toggleMobileMenu = toggleMobileMenu;

// 点击页面其他地方关闭移动菜单
document.addEventListener('click', function(e) {
  const menu = document.getElementById('navMobileMenu');
  const toggle = document.querySelector('.nav-mobile-toggle');
  if (menu && menu.classList.contains('open')) {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      menu.classList.remove('open');
      if (toggle) toggle.classList.remove('open');
    }
  }
});

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
        robot.setConfig({ apiKey: '', apiEndpoint: '', mockMode: true });
      }
    } else {
      robot.setAttribute('api-key', apiConfig.apiKey);
      robot.setAttribute('api-endpoint', apiConfig.apiEndpoint);
      if (typeof robot.setConfig === 'function') {
        robot.setConfig({
          apiKey: apiConfig.apiKey,
          apiEndpoint: apiConfig.apiEndpoint,
          mockMode: false,
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
  // 先检查用户选择的模式
  const savedMode = localStorage.getItem('ai-robot-mode');
  if (savedMode === 'mock') {
    isMockMode = true;
    updateMockIndicator();
    return;
  }

  // 如果没有保存模式，检查是否有 API 配置
  const saved = localStorage.getItem('ai-robot-config');
  if (saved) {
    try {
      apiConfig = JSON.parse(saved);
      if (apiConfig.apiKey && apiConfig.apiEndpoint) {
        isMockMode = false;
        updateMockIndicator();
        updateRobotConfig();
        return;
      }
    } catch (e) {
      console.error('Failed to load saved config:', e);
    }
  }
  // 默认 Mock 模式
  isMockMode = true;
  updateMockIndicator();
}

/**
 * 切换设置弹窗
 */
function toggleSettings() {
  openSettings();
}

/**
 * 打开设置弹窗
 */
function openSettings() {
  const overlay = document.getElementById('apiConfigOverlay');
  const apiKeyInput = document.getElementById('apiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const modeOptions = document.querySelectorAll('.mode-option');
  const apiForm = document.getElementById('apiConfigForm');
  const mockConfirmActions = document.getElementById('mockConfirmActions');
  const apiFormActions = document.querySelector('.api-form-actions');

  // 设置当前模式
  modeOptions.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.mode === (isMockMode ? 'mock' : 'api'));
  });

  // 根据模式显示/隐藏表单和按钮
  if (isMockMode) {
    apiForm?.classList.remove('visible');
    apiFormActions?.classList.add('hidden');
    mockConfirmActions?.classList.remove('hidden');
  } else {
    apiForm?.classList.add('visible');
    apiFormActions?.classList.remove('hidden');
    mockConfirmActions?.classList.add('hidden');
    if (apiKeyInput) apiKeyInput.value = apiConfig.apiKey || '';
    if (apiEndpointInput) apiEndpointInput.value = apiConfig.apiEndpoint || '';
  }

  overlay?.classList.add('visible');
}

/**
 * 选择模式
 */
function selectMode(mode) {
  const modeOptions = document.querySelectorAll('.mode-option');
  const apiForm = document.getElementById('apiConfigForm');
  const mockConfirmActions = document.getElementById('mockConfirmActions');
  const apiFormActions = document.querySelector('.api-form-actions');
  const apiKeyInput = document.getElementById('apiKey');

  modeOptions.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.mode === mode);
  });

  if (mode === 'mock') {
    apiForm?.classList.remove('visible');
    apiFormActions?.classList.add('hidden');
    mockConfirmActions?.classList.remove('hidden');
  } else {
    apiForm?.classList.add('visible');
    apiFormActions?.classList.remove('hidden');
    mockConfirmActions?.classList.add('hidden');
    setTimeout(() => {
      apiKeyInput?.focus();
    }, 100);
  }
}

/**
 * 确认 Mock 模式
 */
function confirmMockMode() {
  isMockMode = true;
  // 保存到 localStorage，覆盖之前的 API 配置选择
  localStorage.setItem('ai-robot-mode', 'mock');
  updateMockIndicator();
  updateRobotConfig();
  closeApiConfig();
  showStatus('已切换到 Mock 模式', 'success');
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
  // 保存模式选择为 API
  localStorage.setItem('ai-robot-mode', 'api');

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
    // 初始化皮肤切换器
    initSkinSwitcher();
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
      initSkinSwitcher();
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
 * 初始化皮肤切换器
 */
let currentSkin = 'default';
function initSkinSwitcher() {
  const skinBtns = document.querySelectorAll('.skin-btn');
  const robot = document.getElementById('robot');

  console.log('[SkinSwitcher] Init, robot:', robot);
  console.log('[SkinSwitcher] robot.setSkin:', robot?.setSkin);

  // 从 localStorage 加载皮肤偏好
  const savedSkin = localStorage.getItem('ai-robot-skin');
  const initialSkin = savedSkin || currentSkin;

  // 设置初始激活状态
  skinBtns.forEach(btn => {
    if (btn.dataset.skin === initialSkin) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      const newSkin = btn.dataset.skin;
      console.log('[SkinSwitcher] Clicked skin:', newSkin);
      if (!newSkin || newSkin === currentSkin) {
        console.log('[SkinSwitcher] Same skin or invalid, skipping');
        return;
      }

      // 更新激活状态
      skinBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 切换机器人皮肤
      if (robot && typeof robot.setSkin === 'function') {
        console.log('[SkinSwitcher] Calling robot.setSkin(', newSkin, ')');
        robot.setSkin(newSkin);
      } else {
        console.log('[SkinSwitcher] robot.setSkin is not a function');
      }

      currentSkin = newSkin;

      // 保存到 localStorage
      localStorage.setItem('ai-robot-skin', currentSkin);

      // 触发发光效果
      if (typeof robot.showHintBubble === 'function') {
        robot.showHintBubble();
      }
    });
  });

  // 如果从 localStorage 加载了皮肤，应用它
  if (savedSkin && savedSkin !== currentSkin) {
    const targetBtn = document.querySelector(`.skin-btn[data-skin="${savedSkin}"]`);
    if (targetBtn) {
      targetBtn.click();
    }
  }
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
  window.toggleSettings = toggleSettings;
  window.selectMode = selectMode;
  window.confirmMockMode = confirmMockMode;
  window.closeApiConfig = closeApiConfig;
  window.saveApiConfig = saveApiConfig;
  window.switchLanguage = switchLanguage;
  window.toggleLanguageDropdown = toggleLanguageDropdown;
  window.activateRobot = activateRobot;
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
