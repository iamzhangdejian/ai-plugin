/**
 * State Machine - 机器人状态管理
 */

import type { RobotState } from '../types';

type StateCallback = (state: RobotState, previousState: RobotState) => void;

/**
 * 状态机类
 * 管理机器人状态转换和状态变更回调
 */
export class StateMachine {
  private currentState: RobotState = 'idle';
  private callbacks: Map<RobotState, Set<StateCallback>> = new Map();
  private globalCallbacks: Set<StateCallback> = new Set();

  // 定义允许的状态转换
  private allowedTransitions: Record<RobotState, RobotState[]> = {
    idle: ['dragging', 'listening', 'thinking', 'speaking', 'hidden'],
    dragging: ['idle', 'listening', 'thinking', 'speaking', 'hidden'],
    listening: ['idle', 'thinking', 'speaking', 'hidden'],
    thinking: ['idle', 'speaking', 'listening', 'hidden'],
    speaking: ['idle', 'listening', 'thinking', 'hidden'],
    hidden: ['idle'],
  };

  /**
   * 获取当前状态
   */
  getState(): RobotState {
    return this.currentState;
  }

  /**
   * 检查状态转换是否允许
   */
  private canTransition(to: RobotState): boolean {
    const allowedStates = this.allowedTransitions[this.currentState];
    return allowedStates?.includes(to) ?? false;
  }

  /**
   * 设置新状态
   * @param newState - 新状态
   * @param force - 是否强制转换（忽略规则）
   * @returns 是否成功转换
   */
  setState(newState: RobotState, force = false): boolean {
    if (newState === this.currentState && !force) {
      return true;
    }

    if (!force && !this.canTransition(newState)) {
      console.warn(`[StateMachine] Invalid transition: ${this.currentState} -> ${newState}`);
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // 触发状态特定回调
    const stateCallbacks = this.callbacks.get(newState);
    if (stateCallbacks) {
      stateCallbacks.forEach(cb => cb(newState, previousState));
    }

    // 触发全局回调
    this.globalCallbacks.forEach(cb => cb(newState, previousState));

    // 触发自定义事件
    this.dispatchEvent(newState, previousState);

    return true;
  }

  /**
   * 注册状态变更回调
   * @param state - 监听的状态，'*' 表示所有状态
   * @param callback - 回调函数
   */
  on(state: RobotState | '*', callback: StateCallback): void {
    if (state === '*') {
      this.globalCallbacks.add(callback);
    } else {
      const callbacks = this.callbacks.get(state) || new Set();
      callbacks.add(callback);
      this.callbacks.set(state, callbacks);
    }
  }

  /**
   * 移除状态变更回调
   * @param state - 状态
   * @param callback - 回调函数
   */
  off(state: RobotState | '*', callback: StateCallback): void {
    if (state === '*') {
      this.globalCallbacks.delete(callback);
    } else {
      const callbacks = this.callbacks.get(state);
      if (callbacks) {
        callbacks.delete(callback);
      }
    }
  }

  /**
   * 清除所有回调
   */
  clearCallbacks(): void {
    this.callbacks.clear();
    this.globalCallbacks.clear();
  }

  /**
   * 派发事件（由外部元素监听）
   */
  private dispatchEvent(newState: RobotState, previousState: RobotState): void {
    const event = new CustomEvent('state-change', {
      detail: { from: previousState, to: newState },
      bubbles: true,
      composed: true,
    });
    window.dispatchEvent(event);
  }

  /**
   * 是否是活跃状态（非隐藏）
   */
  isActive(): boolean {
    return this.currentState !== 'hidden';
  }

  /**
   * 是否是交互状态（listening/thinking/speaking）
   */
  isInteracting(): boolean {
    return ['listening', 'thinking', 'speaking'].includes(this.currentState);
  }

  /**
   * 重置为初始状态
   */
  reset(): void {
    this.setState('idle', true);
  }
}
