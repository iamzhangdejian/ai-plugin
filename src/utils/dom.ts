/**
 * DOM 工具函数
 */

/**
 * 创建元素
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attributes?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
}

/**
 * 设置样式
 */
export function setStyles(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration> | Record<string, string>
): void {
  Object.assign(element.style, styles);
}

/**
 * 添加类名
 */
export function addClass(element: HTMLElement, ...classes: string[]): void {
  element.classList.add(...classes);
}

/**
 * 移除类名
 */
export function removeClass(element: HTMLElement, ...classes: string[]): void {
  element.classList.remove(...classes);
}

/**
 * 切换类名
 */
export function toggleClass(element: HTMLElement, className: string, force?: boolean): void {
  element.classList.toggle(className, force);
}

/**
 * 检查是否包含类名
 */
export function hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * 查找元素
 */
export function querySelector<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  context: ParentNode = document
): HTMLElementTagNameMap[K] | null {
  return context.querySelector(selector);
}

/**
 * 查找所有元素
 */
export function querySelectorAll<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  context: ParentNode = document
): NodeListOf<HTMLElementTagNameMap[K]> {
  return context.querySelectorAll(selector);
}

/**
 * Append 子元素
 */
export function appendChild(parent: HTMLElement, child: Node): void {
  parent.appendChild(child);
}

/**
 * 移除元素
 */
export function removeElement(element: Node): void {
  element.parentNode?.removeChild(element);
}

/**
 * 清空子元素
 */
export function clearChildren(parent: HTMLElement): void {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

/**
 * 插入到指定位置之前
 */
export function insertBefore(parent: HTMLElement, child: Node, reference: Node | null): void {
  parent.insertBefore(child, reference);
}

/**
 * 获取元素相对于视口的位置
 */
export function getViewportPosition(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
  };
}

/**
 * 设置元素位置
 */
export function setPosition(element: HTMLElement, x: number, y: number): void {
  element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
}

/**
 * 动画帧工具
 */
export function raf(callback: (timestamp: number) => void): number {
  return requestAnimationFrame(callback);
}

export function caf(handle: number): void {
  cancelAnimationFrame(handle);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 等待
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建 Shadow DOM 样式容器
 */
export function createShadowStyles(
  shadow: ShadowRoot,
  cssText: string
): void {
  const style = document.createElement('style');
  style.textContent = cssText;
  shadow.appendChild(style);
}
