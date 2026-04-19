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

    const isEmbedded = options.embedded ?? false;
    // 对于 embedded 模式，使用传入的 Shadow DOM（来自 AIRobotElement）
    // 这样 wrapper 才能正确渲染在 Shadow DOM 内部
    if (isEmbedded) {
      this.shadow = container instanceof ShadowRoot ? container : (container as HTMLElement).shadowRoot || container.attachShadow({ mode: 'open' });
    } else {
      this.shadow = isShadowRoot ? container : container.attachShadow({ mode: 'open' });
    }

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
    this.createStyles();
    this.createStructure();

    const wrapper = this.getWrapper();

    this.robotView = new RobotView(
      wrapper.querySelector('.ai-robot-canvas-container')!,
      { theme: this.options.theme, size: this.options.embedded ? 250 : 120 }
    );

    this.bindEvents();
    this.stateMachine.setState(this.options.visible ? 'idle' : 'hidden');

    // 对于 embedded 模式，不在此处设置位置，由 AIRobotElement 异步设置
    // 因为 wrapper 使用 position: absolute，需要等待布局完成后才能正确计算位置
    if (!this.options.embedded) {
      if (this.options.initialPosition && (this.options.initialPosition.x !== 0 || this.options.initialPosition.y !== 0)) {
        this.setPosition(this.options.initialPosition.x, this.options.initialPosition.y);
      }
    }

    this.dispatch('ready');
  }

  /**
   * 创建样式
   */
  private createStyles(): void {
    const style = createElement('style');

    // 对于 embedded 模式，:host 由 AIRobotElement 控制，我们只关心 wrapper 的样式
    // non-embedded 模式使用默认的 :host 样式
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
        /* 响应式尺寸 - 默认移动端 */
        --robot-size: 80px;
        --robot-size-hover: 90px;

        position: fixed;
        left: 20px;
        top: 50%;
        transform: translateY(-50%);
        width: var(--robot-size);
        height: var(--robot-size);
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 999999;
        overflow: visible;
        transition: width 0.3s ease, height 0.3s ease;
      }

      /* 嵌入式模式 - 使用 position: fixed 相对于 viewport 定位 */
      .ai-robot-wrapper.embedded {
        /* 嵌入式机器人响应式尺寸 */
        --robot-size-embedded: 180px;

        position: fixed;
        width: var(--robot-size-embedded);
        height: var(--robot-size-embedded);
        cursor: pointer;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 999999;
        transition: width 0.3s ease, height 0.3s ease;
      }

      /* 平板适配 (≥768px) */
      @media (min-width: 768px) {
        .ai-robot-wrapper {
          --robot-size: 100px;
          --robot-size-hover: 115px;
        }

        .ai-robot-wrapper.embedded {
          --robot-size-embedded: 220px;
        }
      }

      /* 桌面适配 (≥1024px) */
      @media (min-width: 1024px) {
        .ai-robot-wrapper {
          --robot-size: 120px;
          --robot-size-hover: 140px;
        }

        .ai-robot-wrapper.embedded {
          --robot-size-embedded: 250px;
        }
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

      /* 移动端触摸友好的大按钮 */
      @media (max-width: 480px) {
        .ai-robot-wrapper {
          --robot-size: 80px;
        }
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
        top: -5px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 10px 18px;
        border-radius: 24px;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        box-shadow:
          0 4px 20px rgba(102, 126, 234, 0.4),
          0 2px 8px rgba(102, 126, 234, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.3);
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        pointer-events: none;
        z-index: 10;
        letter-spacing: 0.02em;
      }

      .ai-robot-hint-bubble::before {
        content: '✨';
        margin-right: 6px;
        display: inline-block;
        animation: sparkle 1.5s ease-in-out infinite;
      }

      .ai-robot-hint-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #764ba2;
        filter: drop-shadow(0 2px 3px rgba(102, 126, 234, 0.3));
      }

      .ai-robot-hint-bubble.visible {
        opacity: 1;
        top: -20px;
        animation: bubblePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                   bubbleFloat 0.6s ease-in-out infinite 0.5s;
      }

      @keyframes bubblePop {
        0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }

      @keyframes bubbleFloat {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(-4px); }
      }

      @keyframes sparkle {
        0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
        50% { transform: scale(1.2) rotate(15deg); opacity: 0.8; }
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

      /* 可爱的晃动动画 */
      @keyframes hintWiggle {
        0%, 100% { transform: rotate(0deg) scale(1); }
        20% { transform: rotate(-6deg) scale(1.05); }
        40% { transform: rotate(6deg) scale(1.05); }
        60% { transform: rotate(-4deg) scale(1.02); }
        80% { transform: rotate(4deg) scale(1.02); }
      }

      /* 气泡弹出动画 */
      @keyframes bubblePop {
        0% { transform: translateX(-50%) scale(0.8); opacity: 0; }
        50% { transform: translateX(-50%) scale(1.05); opacity: 1; }
        100% { transform: translateX(-50%) scale(1); opacity: 1; }
      }

      .ai-robot-hint-bubble.visible {
        animation: bubblePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
    `;

    // 对于 embedded 模式，wrapper 在 document.body 中，样式需要添加到 document.head
    // 对于 non-embedded 模式，wrapper 在 shadow DOM 中，样式添加到 shadow DOM
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

    // 对于 embedded 模式，wrapper 需要添加到 document.body 而不是 shadow DOM
    // 因为 AIRobotElement 本身被设置为 visibility: hidden，会隐藏 shadow DOM 内的所有内容
    // 使用 position: fixed 可以让 wrapper 脱离文档流，相对于 viewport 定位
    if (this.options.embedded) {
      document.body.appendChild(wrapper);
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
      // 使用 CSS 变量获取当前尺寸
      const computedStyle = getComputedStyle(wrapper);
      const wrapperSize = parseInt(computedStyle.getPropertyValue('--robot-size')) ||
                         parseInt(computedStyle.width) ||
                         (this.options.embedded ? 360 : 180);
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
   * 设置皮肤
   */
  setSkin(skin: 'default' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'dark'): void {
    this.robotView.setSkin(skin);
  }

  /**
   * 获取所有皮肤
   */
  getSkins(): Record<string, import('../../3d/Robot3D').RobotSkin> {
    return this.robotView.getSkins();
  }

  /**
   * 获取 wrapper 元素（公开方法供外部访问）
   */
  getWrapper(): HTMLElement {
    // 对于 embedded 模式，wrapper 在 document.body 中；否则在 shadow DOM 中
    if (this.options.embedded) {
      const wrapper = document.body.querySelector('.ai-robot-wrapper.embedded') as HTMLElement;
      return wrapper;
    }
    const wrapper = this.shadow.querySelector('.ai-robot-wrapper') as HTMLElement;
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
  setPosition(x: number, y: number, offsetY: number = 0): void {
    const wrapper = this.getWrapper();
    if (!wrapper) {
      console.error('[Robot] Wrapper not found in setPosition');
      return;
    }

    // 获取机器人实际尺寸，计算中心点
    const rect = wrapper.getBoundingClientRect();
    const wrapperWidth = rect.width || wrapper.offsetWidth;
    const wrapperHeight = rect.height || wrapper.offsetHeight;

    console.log('[Robot] setPosition:', { x, y, wrapperWidth, wrapperHeight, rect, offsetY });

    // 设置位置时减去机器人尺寸的一半，使机器人中心对准目标位置
    const left = x - wrapperWidth / 2;
    const top = y - wrapperHeight / 2 + offsetY;

    console.log('[Robot] Calculated position:', { left, top });

    wrapper.style.left = left + 'px';
    wrapper.style.top = top + 'px';
    wrapper.style.right = 'auto';
    wrapper.style.transform = 'none';
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
      // 使用拖拽提示文字（✨ 符号由 CSS ::before 添加）
      hintBubble.textContent = t('robot.dragHint');
      hintBubble.classList.remove('visible');

      // 触发重绘以重新播放动画
      void hintBubble.offsetWidth;

      hintBubble.classList.add('visible');

      // 添加可爱的晃动动画
      wrapper.style.animation = 'hintWiggle 0.6s ease-in-out';
      setTimeout(() => {
        if (wrapper) {
          wrapper.style.animation = '';
        }
      }, 600);
    }

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
    const styleCleanup = this.callbacks.get('_style');
    if (styleCleanup) {
      styleCleanup.forEach(fn => fn());
    }
    this.robotView.destroy();
    this.stateMachine.clearCallbacks();
    this.callbacks.clear();

    // 移除 wrapper 元素
    const wrapper = this.getWrapper();
    if (wrapper) {
      wrapper.remove();
    }
  }
}
