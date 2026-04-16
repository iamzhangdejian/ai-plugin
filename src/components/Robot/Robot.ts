/**
 * Robot - 机器人主组件
 */

import { RobotView } from './RobotView';
import { StateMachine } from '../../core/StateMachine';
import type { RobotState } from '../../types';
import { createElement } from '../../utils/dom';
import { t, loadLocaleFromStorage } from '../../i18n';

export interface RobotOptions {
  theme?: 'blue' | 'green' | 'purple';
  position?: 'left' | 'right';
  visible?: boolean;
  embedded?: boolean;
  initialPosition?: { x: number; y: number };
}

/**
 * 机器人主组件
 */
export class Robot {
  private container: HTMLElement;
  private shadow: ShadowRoot;
  private options: Required<RobotOptions>;
  private robotView!: RobotView;
  private stateMachine: StateMachine;
  private callbacks: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  // 拖拽相关
  private isDragging = false;
  private startPos = { x: 0, y: 0 };
  private currentPos = { x: 0, y: 0 };
  private hasMoved = false;

  constructor(container: HTMLElement | ShadowRoot, options: RobotOptions = {}) {
    // 判断容器类型
    const isShadowRoot = container instanceof ShadowRoot;
    this.container = (isShadowRoot ? container.host : container) as HTMLElement;

    // 对于 embedded 模式，不使用 Shadow DOM，直接在 Light DOM 中创建
    // 这样 position: fixed 才能正确相对于 viewport 定位
    const isEmbedded = options.embedded ?? false;
    if (isEmbedded) {
      // 在 Light DOM 中，直接使用容器本身
      this.shadow = container instanceof ShadowRoot ? container : (container as HTMLElement).shadowRoot || container.attachShadow({ mode: 'open' });
    } else {
      this.shadow = isShadowRoot ? container : container.attachShadow({ mode: 'open' });
    }

    console.log('[Robot] Constructor called:', {
      containerType: isShadowRoot ? 'ShadowRoot' : 'HTMLElement',
      container: this.container,
      shadow: this.shadow,
      isEmbedded
    });

    this.options = {
      theme: 'blue',
      position: 'right',
      visible: true,
      embedded: isEmbedded,
      initialPosition: { x: 0, y: 0 },
      ...options,
    };

    this.stateMachine = new StateMachine();
    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    console.log('[Robot] Initializing...', { embedded: this.options.embedded });

    this.createStyles();
    this.createStructure();

    const wrapper = this.getWrapper();
    console.log('[Robot] Structure created, wrapper:', wrapper);

    this.robotView = new RobotView(
      wrapper.querySelector('.ai-robot-canvas-container')!,
      { theme: this.options.theme, size: this.options.embedded ? 380 : 120 }
    );

    console.log('[Robot] RobotView created');

    this.bindEvents();
    this.stateMachine.setState(this.options.visible ? 'idle' : 'hidden');

    console.log('[Robot] Initial state:', this.options.visible ? 'idle' : 'hidden');

    // 对于 embedded 模式，不在此处设置位置，由 AIRobotElement 异步设置
    // 因为 wrapper 在 document.body 中，需要等待布局完成后才能正确计算位置
    if (!this.options.embedded) {
      if (this.options.initialPosition && (this.options.initialPosition.x !== 0 || this.options.initialPosition.y !== 0)) {
        this.setPosition(this.options.initialPosition.x, this.options.initialPosition.y);
      }
    }

    this.dispatch('ready');

    console.log('[Robot] Initialization complete');
  }

  /**
   * 创建样式
   */
  private createStyles(): void {
    const style = createElement('style');

    // 对于 embedded 模式，不使用 :host 选择器
    const hostStyles = this.options.embedded ? '' : `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        display: block;
        width: 100%;
        height: 100%;
        position: relative;
        * { box-sizing: border-box; }
      }
    `;

    style.textContent = `${hostStyles}
      .ai-robot-wrapper {
        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: 120px;
        height: 120px;
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 999999;
        overflow: visible;
        border: 2px solid rgba(0, 255, 0, 0.5);
      }

      .ai-robot-wrapper.embedded {
        position: fixed;
        width: 380px;
        height: 420px;
        cursor: pointer;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 999999;
        border: 2px solid rgba(0, 255, 0, 0.5);
      }

      .ai-robot-wrapper:active {
        cursor: grabbing;
      }

      .ai-robot-wrapper.dragging {
        cursor: grabbing;
        transform: scale(1.1) !important;
      }

      .ai-robot-wrapper.embedded.dragging {
        transform: scale(1.05) !important;
      }

      .ai-robot-canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        overflow: visible;
        transform-origin: center center;
        background: transparent;
        border: 2px dashed rgba(255, 0, 0, 0.5);
      }

      .ai-robot-canvas-container canvas {
        width: 100% !important;
        height: 100% !important;
        display: block;
        background: transparent;
      }

      .ai-robot-wrapper.idle {
        /* CSS 动画已移除，使用 Three.js 内部动画 */
      }

      .ai-robot-wrapper.hidden {
        opacity: 0;
        pointer-events: none;
        transform: scale(0.8);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }

      .ai-robot-wrapper.dragging .ai-robot-canvas-container {
        transform: scale(1.15);
      }

      /* 提示气泡 */
      .ai-robot-hint-bubble {
        position: absolute;
        top: -90px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 500;
        white-space: nowrap;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 10;
      }

      .ai-robot-hint-bubble::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid #764ba2;
      }

      .ai-robot-hint-bubble.visible {
        opacity: 1;
        top: -100px;
      }

      /* 机器人发光圈效果 - 围绕机器人的光环 */
      .ai-robot-wrapper.robot-glow::before {
        content: '';
        position: absolute;
        /* 调整位置以匹配机器人本体的视觉中心 */
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120%;
        height: 120%;
        border-radius: 50%;
        border: 3px solid rgba(102, 126, 234, 0.6);
        box-shadow: 0 0 20px rgba(102, 126, 234, 0.4),
                    0 0 40px rgba(102, 126, 234, 0.3),
                    inset 0 0 20px rgba(102, 126, 234, 0.2);
        animation: robotGlowRing 1.5s ease-out forwards;
        pointer-events: none;
        z-index: -1;
      }

      @keyframes robotGlowRing {
        0% {
          width: 100%;
          height: 100%;
          opacity: 1;
          border-width: 4px;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.6),
                      0 0 40px rgba(102, 126, 234, 0.4),
                      inset 0 0 20px rgba(102, 126, 234, 0.2);
        }
        100% {
          width: 200%;
          height: 200%;
          opacity: 0;
          border-width: 0px;
          box-shadow: 0 0 0 rgba(102, 126, 234, 0),
                      0 0 0 rgba(102, 126, 234, 0),
                      inset 0 0 0 rgba(102, 126, 234, 0);
        }
      }
    `;

    // 对于 embedded 模式，样式添加到 document head；否则添加到 Shadow DOM
    if (this.options.embedded) {
      document.head.appendChild(style);
      // 保存样式引用以便清理
      this.callbacks.set('_style', new Set([() => style.remove()]));
    } else {
      this.shadow.appendChild(style);
    }
  }

  /**
   * 创建结构
   */
  private createStructure(): void {
    const wrapper = createElement('div', 'ai-robot-wrapper');
    wrapper.classList.add('idle');

    // 嵌入模式添加类名
    if (this.options.embedded) {
      wrapper.classList.add('embedded');
    }

    // 加载语言偏好
    loadLocaleFromStorage();

    // 提示气泡
    const hintBubble = createElement('div', 'ai-robot-hint-bubble');
    hintBubble.textContent = t('robot.hint');
    wrapper.appendChild(hintBubble);

    const canvasContainer = createElement('div', 'ai-robot-canvas-container');
    wrapper.appendChild(canvasContainer);

    // 对于 embedded 模式，将 wrapper 直接添加到 document.body
    // 这样 position: fixed 才能相对于 viewport 正确定位，不受任何祖先元素影响
    if (this.options.embedded) {
      document.body.appendChild(wrapper);
      console.log('[Robot] Wrapper appended to document.body for embedded mode');
    } else {
      this.shadow.appendChild(wrapper);
    }
  }

  /**
   * 绑定事件 - 使用全局事件确保拖拽流畅
   */
  private bindEvents(): void {
    // 使用 getWrapper 方法正确获取 wrapper 元素
    const wrapper = this.getWrapper();

    if (!wrapper) {
      console.error('[Robot] Wrapper element not found in bindEvents');
      return;
    }

    wrapper.addEventListener('pointerdown', ((e: PointerEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.hasMoved = false;

      // 记录初始位置
      this.startPos = { x: e.clientX, y: e.clientY };

      // 获取当前元素位置
      const rect = wrapper.getBoundingClientRect();
      this.currentPos = { x: rect.left, y: rect.top - window.scrollY };

      // 设置捕获确保事件不会丢失
      wrapper.setPointerCapture(e.pointerId);

      // 移除动画，确保拖拽流畅
      wrapper.style.transition = 'none';
      wrapper.classList.add('dragging');

      this.stateMachine.setState('dragging');
      this.dispatch('dragStart');
    }) as EventListener);

    // 使用 document 监听确保拖拽流畅
    const onPointerMove = ((e: PointerEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const dx = e.clientX - this.startPos.x;
      const dy = e.clientY - this.startPos.y;

      // 检测是否移动
      if (!this.hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
        this.hasMoved = true;
      }

      // 实时更新位置 - 直接跟随鼠标
      const newX = this.currentPos.x + dx;
      const newY = this.currentPos.y + dy + window.scrollY;

      // 边界检查 - 限制在视口内，确保机器人整体不超出屏幕边缘
      const wrapperSize = this.options.embedded ? 360 : 180;
      const maxX = window.innerWidth - wrapperSize;
      const maxY = window.innerHeight - wrapperSize;

      wrapper.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
      wrapper.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
      wrapper.style.transform = 'none';
    }) as EventListener;

    const onPointerUp = ((e: PointerEvent) => {
      if (!this.isDragging) return;

      this.isDragging = false;
      wrapper.classList.remove('dragging');
      wrapper.releasePointerCapture(e.pointerId);

      this.stateMachine.setState('idle');
      this.dispatch('dragEnd');

      // 移除动画过渡
      wrapper.style.transition = 'none';

      // 判断是点击还是拖拽
      if (!this.hasMoved) {
        this.dispatch('click');
      }
      // 不吸附，停在当前位置

      this.hasMoved = false;
    }) as EventListener;

    console.log('[Robot] Events bound to document for drag functionality');

    // 绑定到 document 确保拖拽流畅
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);

    // 清理
    this.callbacks.set('_cleanup', new Set([() => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    }]));

    // 状态机事件
    this.stateMachine.on('*', (newState, previousState) => {
      this.handleStateChange(newState, previousState);
    });
  }

  /**
   * 处理状态变化
   */
  private handleStateChange(newState: RobotState, previousState: RobotState): void {
    const wrapper = this.getWrapper();

    if (!wrapper) {
      console.error('[Robot] Wrapper not found in handleStateChange');
      return;
    }

    wrapper.classList.remove(previousState);
    wrapper.classList.add(newState);

    this.robotView.updateState(newState);
    this.dispatch('stateChange', { from: previousState, to: newState });
  }

  /**
   * 派发事件
   */
  private dispatch(event: string, detail?: unknown): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(detail));
    }

    const domEvent = new CustomEvent(`robot-${event}`, {
      detail,
      bubbles: true,
      composed: true,
    });
    this.container.dispatchEvent(domEvent);
    window.dispatchEvent(domEvent);
  }

  /**
   * 设置状态
   */
  setState(state: RobotState): void {
    this.stateMachine.setState(state);
  }

  /**
   * 获取状态
   */
  getState(): RobotState {
    return this.stateMachine.getState();
  }

  /**
   * 显示
   */
  show(): void {
    this.stateMachine.setState('idle', true);
  }

  /**
   * 隐藏
   */
  hide(): void {
    this.stateMachine.setState('hidden');
  }

  /**
   * 切换显示
   */
  toggle(): void {
    const state = this.stateMachine.getState();
    if (state === 'hidden') {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'blue' | 'green' | 'purple'): void {
    this.options.theme = theme;
    this.robotView.setTheme(theme);
  }

  /**
   * 获取 wrapper 元素
   */
  private getWrapper(): HTMLElement {
    // 对于 embedded 模式，wrapper 在 document.body 中；否则在 Shadow DOM 中
    if (this.options.embedded) {
      const wrapper = document.querySelector('.ai-robot-wrapper.embedded') as HTMLElement;
      console.log('[Robot] getWrapper (embedded):', wrapper);
      return wrapper;
    }
    const wrapper = this.shadow.querySelector('.ai-robot-wrapper') as HTMLElement;
    console.log('[Robot] getWrapper (non-embedded):', wrapper);
    return wrapper;
  }

  /**
   * 获取位置
   */
  getPosition(): { x: number; y: number } {
    const wrapper = this.getWrapper();
    const rect = wrapper.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  }

  /**
   * 获取头部位置（用于气泡对话框定位）
   */
  getHeadPosition(): { x: number; y: number } {
    const wrapper = this.getWrapper();
    const rect = wrapper.getBoundingClientRect();
    // 头部位置在容器的上三分之一处
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * 0.3
    };
  }

  /**
   * 获取边界矩形
   */
  getBoundingRect(): DOMRect {
    const wrapper = this.getWrapper();
    return wrapper.getBoundingClientRect();
  }

  /**
   * 设置位置
   */
  setPosition(x: number, y: number): void {
    const wrapper = this.getWrapper();
    console.log('[Robot] setPosition called:', { x, y, wrapper });
    if (!wrapper) {
      console.error('[Robot] Wrapper not found in setPosition');
      return;
    }
    wrapper.style.left = x + 'px';
    wrapper.style.top = y + 'px';
    wrapper.style.right = 'auto';
    wrapper.style.transform = 'none';
    console.log('[Robot] Position set, wrapper styles:', { left: wrapper.style.left, top: wrapper.style.top });
  }

  /**
   * 注册事件监听
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.callbacks.get(event) || new Set();
    callbacks.add(callback);
    this.callbacks.set(event, callbacks);
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback: (...args: unknown[]) => void): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 获取元素
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * 获取 Shadow Root
   */
  getShadowRoot(): ShadowRoot {
    return this.shadow;
  }

  /**
   * 显示提示气泡
   */
  showHintBubble(): void {
    const wrapper = this.getWrapper();
    const hintBubble = wrapper.querySelector('.ai-robot-hint-bubble') as HTMLElement;

    if (hintBubble) {
      hintBubble.classList.add('visible');
    }

    // 添加发光圈特效
    if (wrapper) {
      wrapper.classList.add('robot-glow');
    }

    setTimeout(() => {
      if (wrapper) {
        wrapper.classList.remove('robot-glow');
      }
    }, 1500);

    setTimeout(() => {
      if (hintBubble) {
        hintBubble.classList.remove('visible');
      }
    }, 3000);
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    const cleanup = this.callbacks.get('_cleanup');
    if (cleanup) {
      cleanup.forEach(fn => fn());
    }
    this.robotView.destroy();
    this.stateMachine.clearCallbacks();
    this.callbacks.clear();

    // 对于 embedded 模式，移除 wrapper 元素；否则移除整个 container
    if (this.options.embedded) {
      const wrapper = this.getWrapper();
      if (wrapper) {
        wrapper.remove();
      }
    } else {
      this.container.remove();
    }
  }
}
