/**
 * AI Robot Assistant - Main Entry
 *
 * 使用方式:
 * 1. 直接引入：import './index'
 * 2. 使用 Web Component: <ai-robot></ai-robot>
 * 3. 使用 API: window.AIRobot.create()
 */

import { AIRobotElement } from './components/AIRobotElement';
import type { AIRobotAPI } from './types/api';
import type { AIRobotConfig } from './types';

// 版本
const VERSION = '1.0.0';

// 是否已注册
let isRegistered = false;

/**
 * 注册 Web Component
 */
function register(): void {
  if (isRegistered) return;

  if (!customElements.get('ai-robot')) {
    customElements.define('ai-robot', AIRobotElement);
  }

  isRegistered = true;
  console.log('[AI Robot] Web Component registered');
}

/**
 * 创建 AI Robot 实例
 * @param container - 容器元素或选择器
 * @param config - 配置选项
 */
function create(container?: HTMLElement | string, config?: AIRobotConfig): AIRobotAPI {
  let targetContainer: HTMLElement;

  // 处理容器
  if (typeof container === 'string') {
    const el = document.querySelector(container);
    if (!el) {
      throw new Error(`Container not found: ${container}`);
    }
    targetContainer = el as HTMLElement;
  } else {
    targetContainer = container || document.body;
  }

  // 创建元素
  const robot = document.createElement('ai-robot');

  // 设置属性
  if (config) {
    if (config.apiKey) robot.setAttribute('api-key', config.apiKey);
    if (config.apiEndpoint) robot.setAttribute('api-endpoint', config.apiEndpoint);
    if (config.wakeWord) robot.setAttribute('wake-word', config.wakeWord);
    if (config.theme) robot.setAttribute('theme', config.theme);
    if (config.position) robot.setAttribute('position', config.position);
    if (config.visible !== undefined) robot.setAttribute('visible', String(config.visible));
  }

  // 添加到容器
  targetContainer.appendChild(robot);

  return robot as unknown as AIRobotAPI;
}

/**
 * 获取已有的机器人实例
 * @param selector - 选择器，默认为 'ai-robot'
 */
function getInstance(selector = 'ai-robot'): AIRobotElement | null {
  return document.querySelector(selector) as AIRobotElement | null;
}

/**
 * 检查浏览器支持
 */
function checkSupport(): {
  webComponents: boolean;
  speechRecognition: boolean;
  speechSynthesis: boolean;
  webGL: boolean;
} {
  return {
    webComponents: 'customElements' in window && 'HTMLElement' in window,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
      } catch {
        return false;
      }
    })(),
  };
}

// 导出全局 API
const AIRobot = {
  create,
  register,
  getInstance,
  checkSupport,
  version: VERSION,
};

// 自动注册（如果在全局 script 标签中引入）
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'AIRobot', {
    value: AIRobot,
    writable: true,
    configurable: true,
  });

  // 文档加载完成后自动注册
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register);
  } else {
    register();
  }
}

// 导出类型
export type { AIRobotAPI, AIRobotConfig };
export { AIRobotElement };
export { AIRobot };
export default AIRobot;
