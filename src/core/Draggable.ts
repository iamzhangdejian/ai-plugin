/**
 * Draggable - 拖拽逻辑管理
 */

export interface DraggableOptions {
  /** 是否启用拖拽 */
  enabled?: boolean;
  /** 是否吸附到边缘 */
  snapToEdge?: boolean;
  /** 是否有惯性动画 */
  inertia?: boolean;
  /** 边界限制 */
  boundary?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** 吸附动画持续时间 */
  snapDuration?: number;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * 拖拽管理类
 * 处理元素的拖拽、惯性、吸附等交互
 */
export class Draggable {
  private element: HTMLElement;
  private options: Required<DraggableOptions>;
  private isDragging = false;
  private startPosition: Position = { x: 0, y: 0 };
  private currentPos: Position = { x: 0, y: 0 };
  private velocity: Position = { x: 0, y: 0 };
  private lastPos: Position = { x: 0, y: 0 };
  private lastTime = 0;
  private animationFrame: number | null = null;
  private hasMoved = false;

  constructor(element: HTMLElement, options: DraggableOptions = {}) {
    this.element = element;
    this.options = {
      enabled: true,
      snapToEdge: true,
      inertia: true,
      boundary: {},
      snapDuration: 300,
      ...options,
    };

    this.init();
  }

  /**
   * 初始化拖拽
   */
  private init(): void {
    if (!this.options.enabled) return;

    // 使用 Pointer Events 统一处理鼠标和触摸
    this.element.addEventListener('pointerdown', this.handlePointerDown);

    // 防止拖拽时选中文本
    this.element.style.userSelect = 'none';
    this.element.style.touchAction = 'none';
    this.element.style.cursor = 'grab';
  }

  /**
   * 指针按下处理
   */
  private handlePointerDown = (e: PointerEvent): void => {
    // 只处理主按键
    if (e.button !== 0) return;

    e.preventDefault();

    this.isDragging = true;
    this.hasMoved = false;

    // 获取当前位置（从 transform 或初始位置）
    const rect = this.element.getBoundingClientRect();
    this.startPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.lastPos = { x: e.clientX, y: e.clientY };
    this.lastTime = e.timeStamp;
    this.velocity = { x: 0, y: 0 };

    // 添加到全局事件监听
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);

    this.element.setPointerCapture(e.pointerId);
    this.element.style.cursor = 'grabbing';

    // 触发自定义事件
    this.element.dispatchEvent(new CustomEvent('drag-start', { bubbles: true, composed: true }));
  };

  /**
   * 指针移动处理
   */
  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;

    e.preventDefault();

    // 检测是否移动
    const dx = e.clientX - this.lastPos.x;
    const dy = e.clientY - this.lastPos.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      this.hasMoved = true;
    }

    // 计算新位置
    const newX = e.clientX - this.startPosition.x;
    const newY = e.clientY - this.startPosition.y;

    // 应用边界限制
    const boundedPos = this.applyBoundary(newX, newY);
    this.currentPos = { x: boundedPos.x, y: boundedPos.y };

    // 更新位置
    this.updatePosition();

    // 计算速度（用于惯性）
    const deltaTime = e.timeStamp - this.lastTime;
    if (deltaTime > 0) {
      this.velocity = {
        x: dx / deltaTime,
        y: dy / deltaTime,
      };
    }

    this.lastPos = { x: e.clientX, y: e.clientY };
    this.lastTime = e.timeStamp;
  };

  /**
   * 指针释放处理
   */
  private handlePointerUp = (e: PointerEvent): void => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.element.releasePointerCapture(e.pointerId);
    this.element.style.cursor = 'grab';

    // 移除全局事件监听
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);

    // 触发自定义事件
    this.element.dispatchEvent(new CustomEvent('drag-end', { bubbles: true, composed: true }));

    // 应用惯性动画
    if (this.options.inertia && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1)) {
      this.applyInertia();
    } else if (this.options.snapToEdge) {
      // 直接吸附到边缘
      this.snapToEdge();
    }
  };

  /**
   * 应用边界限制
   */
  private applyBoundary(x: number, y: number): Position {
    const { boundary } = this.options;
    const rect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = x;
    let newY = y;

    // 左边界
    const leftLimit = boundary.left ?? 0;
    if (newX < leftLimit) newX = leftLimit;

    // 右边界
    const rightLimit = boundary.right ?? viewportWidth - rect.width;
    if (newX > rightLimit) newX = rightLimit;

    // 上边界
    const topLimit = boundary.top ?? 0;
    if (newY < topLimit) newY = topLimit;

    // 下边界
    const bottomLimit = boundary.bottom ?? viewportHeight - rect.height;
    if (newY > bottomLimit) newY = bottomLimit;

    return { x: newX, y: newY };
  }

  /**
   * 更新元素位置
   */
  private updatePosition(): void {
    this.element.style.transform = `translate3d(${this.currentPos.x}px, ${this.currentPos.y}px, 0)`;
  }

  /**
   * 应用惯性动画
   */
  private applyInertia(): void {
    let vx = this.velocity.x * 16; // 转换为每帧位移
    let vy = this.velocity.y * 16;

    const animate = (): void => {
      // 应用摩擦力
      vx *= 0.95;
      vy *= 0.95;

      // 更新位置
      this.currentPos.x += vx;
      this.currentPos.y += vy;

      // 应用边界
      const boundedPos = this.applyBoundary(this.currentPos.x, this.currentPos.y);
      this.currentPos = { x: boundedPos.x, y: boundedPos.y };

      this.updatePosition();

      // 停止条件
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        this.animationFrame = null;
        if (this.options.snapToEdge) {
          this.snapToEdge();
        }
      } else {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * 吸附到最近的边缘
   */
  snapToEdge(): void {
    const rect = this.element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // 判断吸附到左边还是右边
    const centerX = rect.left + this.currentPos.x + rect.width / 2;
    const snapToLeft = centerX < viewportWidth / 2;

    const targetX = snapToLeft
      ? (this.options.boundary.left ?? 16)
      : viewportWidth - rect.width - (this.options.boundary.right ?? 16);

    // 动画吸附
    this.animateToPosition({ x: targetX, y: this.currentPos.y });
  }

  /**
   * 动画移动到目标位置
   */
  private animateToPosition(target: Position): void {
    const startX = this.currentPos.x;
    const startY = this.currentPos.y;
    const duration = this.options.snapDuration;
    const startTime = performance.now();

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number): void => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      this.currentPos.x = startX + (target.x - startX) * easedProgress;
      this.currentPos.y = startY + (target.y - startY) * easedProgress;

      this.updatePosition();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 触发自定义事件
        this.element.dispatchEvent(
          new CustomEvent('drag-snap', {
            bubbles: true,
            composed: true,
            detail: { position: this.currentPos },
          })
        );
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * 设置位置
   */
  setPosition(x: number, y: number): void {
    const boundedPos = this.applyBoundary(x, y);
    this.currentPos = { x: boundedPos.x, y: boundedPos.y };
    this.updatePosition();
  }

  /**
   * 获取当前位置
   */
  getPosition(): Position {
    return { ...this.currentPos };
  }

  /**
   * 是否正在拖拽
   */
  isDragActive(): boolean {
    return this.isDragging;
  }

  /**
   * 是否有移动
   */
  hasDragged(): boolean {
    return this.hasMoved;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
  }
}
