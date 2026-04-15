/**
 * 动画工具函数
 */

import { raf, caf } from './dom';

/**
 * 缓动函数
 */
export const easings = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - --t * t * t * t,
  easeInOutQuart: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 + --t * t * t * t * t,
  easeInOutQuint: (t: number): number => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t: number): number => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t: number): number => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number): number => Math.sqrt(1 - --t * t),
  easeInOutCirc: (t: number): number => {
    return t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
  },
  easeInBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  elasticOut: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  bounceOut: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

/**
 * 动画选项
 */
export interface AnimationOptions {
  duration?: number;
  easing?: keyof typeof easings;
  delay?: number;
  onStart?: () => void;
  onUpdate?: (progress: number, value: number) => void;
  onComplete?: () => void;
}

/**
 * 数值动画
 */
export function animateValue(
  from: number,
  to: number,
  options: AnimationOptions = {}
): { cancel: () => void } {
  const {
    duration = 300,
    easing = 'easeOutQuart',
    delay = 0,
    onStart,
    onUpdate,
    onComplete,
  } = options;

  let animationFrame: number | null = null;
  let startTime: number | null = null;
  let started = false;

  const easeFn = easings[easing];

  const animate = (timestamp: number): void => {
    if (!started) {
      started = true;
      onStart?.();
    }

    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    if (delay > 0 && elapsed < delay) {
      animationFrame = raf(animate);
      return;
    }

    const progress = Math.min((elapsed - delay) / duration, 1);
    const easedProgress = easeFn(progress);
    const currentValue = from + (to - from) * easedProgress;

    onUpdate?.(progress, currentValue);

    if (progress < 1) {
      animationFrame = raf(animate);
    } else {
      onComplete?.();
      animationFrame = null;
    }
  };

  animationFrame = raf(animate);

  return {
    cancel: () => {
      if (animationFrame !== null) {
        caf(animationFrame);
      }
    },
  };
}

/**
 * 位移动画
 */
export function animateTransform(
  element: HTMLElement,
  transform: string,
  options: AnimationOptions = {}
): { cancel: () => void } {
  return animateValue(0, 1, {
    ...options,
    onUpdate: () => {
      element.style.transform = transform;
    },
  });
}

/**
 * 淡入动画
 */
export function fadeIn(
  element: HTMLElement,
  duration = 300
): Promise<void> {
  return new Promise(resolve => {
    element.style.opacity = '0';
    element.style.display = 'block';

    animateValue(0, 1, {
      duration,
      easing: 'easeOutQuad',
      onUpdate: (_, value) => {
        element.style.opacity = String(value);
      },
      onComplete: resolve,
    });
  });
}

/**
 * 淡出动画
 */
export function fadeOut(
  element: HTMLElement,
  duration = 300
): Promise<void> {
  return new Promise(resolve => {
    animateValue(1, 0, {
      duration,
      easing: 'easeInQuad',
      onUpdate: (_, value) => {
        element.style.opacity = String(value);
      },
      onComplete: () => {
        element.style.display = 'none';
        resolve();
      },
    });
  });
}

/**
 * 缩放动画
 */
export function scaleIn(
  element: HTMLElement,
  duration = 300
): Promise<void> {
  return new Promise(resolve => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.display = 'block';

    animateValue(0, 1, {
      duration,
      easing: 'easeOutBack',
      onUpdate: (_, value) => {
        element.style.opacity = String(value);
        element.style.transform = `scale(${0.8 + 0.2 * value})`;
      },
      onComplete: resolve,
    });
  });
}

/**
 * 滑动动画
 */
export function slideIn(
  element: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  duration = 300
): Promise<void> {
  return new Promise(resolve => {
    const transforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)',
    };

    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.display = 'block';

    animateValue(0, 1, {
      duration,
      easing: 'easeOutQuad',
      onUpdate: (_, value) => {
        element.style.opacity = String(value);
        element.style.transform = `translate${direction === 'up' || direction === 'down' ? 'Y' : 'X'}(${(1 - value) * (direction.includes('up') || direction.includes('left') ? 20 : -20)}px)`;
      },
      onComplete: () => {
        element.style.transform = '';
        resolve();
      },
    });
  });
}

/**
 * 脉冲动画
 */
export function pulse(
  element: HTMLElement,
  times = 1,
  duration = 200
): Promise<void> {
  return new Promise(resolve => {
    const originalTransform = element.style.transform;
    let count = 0;

    const doPulse = (): void => {
      animateValue(1, 1.1, {
        duration: duration / 2,
        easing: 'easeInQuad',
        onUpdate: (_, value) => {
          element.style.transform = `scale(${value})`;
        },
        onComplete: () => {
          animateValue(1.1, 1, {
            duration: duration / 2,
            easing: 'easeOutQuad',
            onUpdate: (_, value) => {
              element.style.transform = `scale(${value})`;
            },
            onComplete: () => {
              count++;
              if (count < times) {
                doPulse();
              } else {
                element.style.transform = originalTransform;
                resolve();
              }
            },
          });
        },
      });
    };

    doPulse();
  });
}

/**
 * 摇晃动画
 */
export function shake(
  element: HTMLElement,
  duration = 300
): Promise<void> {
  return new Promise(resolve => {
    const originalTransform = element.style.transform;
    const steps = [
      { x: -10, progress: 0.1 },
      { x: 10, progress: 0.2 },
      { x: -10, progress: 0.3 },
      { x: 10, progress: 0.4 },
      { x: -5, progress: 0.5 },
      { x: 5, progress: 0.6 },
      { x: -5, progress: 0.7 },
      { x: 5, progress: 0.8 },
      { x: 0, progress: 1 },
    ];

    let currentStep = 0;

    const nextStep = (): void => {
      if (currentStep >= steps.length) {
        element.style.transform = originalTransform;
        resolve();
        return;
      }

      const step = steps[currentStep];
      const stepDuration = duration * (step.progress - (steps[currentStep - 1]?.progress || 0));

      animateValue(0, 1, {
        duration: stepDuration,
        easing: 'linear',
        onUpdate: () => {
          element.style.transform = `translateX(${step.x}px)`;
        },
        onComplete: () => {
          currentStep++;
          nextStep();
        },
      });
    };

    nextStep();
  });
}
