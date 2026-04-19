/**
 * RobotView - 机器人视图组件
 */

import { Robot3D, RobotSkins, type RobotSkin } from '../../3d/Robot3D';
import type { RobotState } from '../../types';
import { toggleClass } from '../../utils/dom';

export interface RobotViewOptions {
  theme?: 'blue' | 'green' | 'purple';
  size?: number;
}

/**
 * 机器人视图类
 * 管理机器人的 DOM 结构和状态显示
 */
export class RobotView {
  private container: HTMLElement;
  private options: Required<RobotViewOptions>;
  private robot3D: Robot3D | null = null;
  private state: RobotState = 'idle';

  constructor(container: HTMLElement, options: RobotViewOptions = {}) {
    this.container = container;
    this.options = {
      theme: 'blue',
      size: 120,
      ...options,
    };

    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    console.log('[RobotView] Initializing...', {
      container: this.container,
      containerSize: { width: this.container.clientWidth, height: this.container.clientHeight },
      options: this.options
    });

    // 设置容器样式 - 优先使用 CSS 变量，其次使用 options.size
    const size = this.container.parentElement?.classList.contains('embedded')
      ? this.options.size
      : this.options.size;
    this.container.style.setProperty('--robot-size', `${size}px`);

    // 创建 3D 机器人
    this.robot3D = new Robot3D(this.container, {
      color: this.getThemeColor(),
      size: size,
    });

    console.log('[RobotView] Robot3D created, canvas:', this.container.querySelector('canvas'));

    this.updateState(this.state);

    // 监听容器大小变化
    this.observeContainerResize();
  }

  /**
   * 监听容器大小变化
   */
  private observeContainerResize(): void {
    if (!('ResizeObserver' in window)) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // ResizeObserver 会自动触发 Three.js 的 handleResize
        // 因为 Robot3D 已经监听了 window resize 事件
        console.log('[RobotView] Container resized:', { width, height });
      }
    });

    observer.observe(this.container);

    // 保存观察者引用以便清理
    (this as any)._resizeObserver = observer;
  }

  /**
   * 获取主题颜色
   */
  private getThemeColor(): string {
    const colors: Record<string, string> = {
      blue: '#3B82F6',
      green: '#10B981',
      purple: '#8B5CF6',
    };
    return colors[this.options.theme] || colors.blue;
  }

  /**
   * 更新状态
   */
  updateState(state: RobotState): void {
    this.state = state;

    // 更新类名
    const states: RobotState[] = ['idle', 'dragging', 'listening', 'thinking', 'speaking', 'hidden'];
    states.forEach(s => {
      toggleClass(this.container, s, s === state);
    });

    // 更新 3D 机器人状态
    if (this.robot3D) {
      this.robot3D.setState(state);
    }
  }

  /**
   * 获取状态
   */
  getState(): RobotState {
    return this.state;
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'blue' | 'green' | 'purple'): void {
    this.options.theme = theme;
    if (this.robot3D) {
      this.robot3D.setColor(this.getThemeColor());
    }
  }

  /**
   * 设置皮肤
   */
  setSkin(skin: 'default' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'dark'): void {
    if (this.robot3D) {
      this.robot3D.setSkin(skin);
    }
  }

  /**
   * 获取所有皮肤
   */
  getSkins(): Record<string, RobotSkin> {
    return RobotSkins;
  }

  /**
   * 设置大小
   */
  setSize(size: number): void {
    this.options.size = size;
    this.container.style.setProperty('--robot-size', `${size}px`);
  }

  /**
   * 获取容器元素
   */
  getElement(): HTMLElement {
    return this.container;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    // 停止 ResizeObserver
    if ((this as any)._resizeObserver) {
      (this as any)._resizeObserver.disconnect();
      (this as any)._resizeObserver = null;
    }
    if (this.robot3D) {
      this.robot3D.destroy();
      this.robot3D = null;
    }
  }
}
