/**
 * RobotView - 机器人视图组件
 */

import { Robot3D } from '../../3d/Robot3D';
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
    // 设置容器样式
    this.container.style.setProperty('--robot-size', `${this.options.size}px`);

    // 创建 3D 机器人
    this.robot3D = new Robot3D(this.container, {
      color: this.getThemeColor(),
      size: this.options.size,
    });

    this.updateState(this.state);
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
    if (this.robot3D) {
      this.robot3D.destroy();
      this.robot3D = null;
    }
  }
}
