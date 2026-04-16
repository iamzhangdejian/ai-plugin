/**
 * Robot3D - Three.js 3D 人形机器人渲染
 * 设计灵感：大白 + EVE - 圆润可爱风格
 * 科幻配色：蓝白渐变 + 能量发光环
 */

import * as THREE from 'three';
import type { RobotState } from '../types';

// 眼睛部件接口
interface EyePart {
  group: THREE.Group;
  iris: THREE.Mesh;
  base: THREE.Mesh;
}

export interface Robot3DOptions {
  size?: number;
  color?: string;
  eyeColor?: string;
  animationSpeed?: number;
  quality?: 'low' | 'medium' | 'high';
}

/**
 * 3D 人形机器人渲染类 - 大白风格圆润设计
 */
export class Robot3D {
  private container: HTMLElement;
  private options: Required<Robot3DOptions>;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private robot: THREE.Group;

  // 身体部件
  private head: THREE.Mesh | null = null;
  private body: THREE.Mesh | null = null;
  private leftArm: THREE.Group | null = null;
  private rightArm: THREE.Group | null = null;
  private leftLeg: THREE.Group | null = null;
  private rightLeg: THREE.Group | null = null;

  // 面部特征 - 眼睛组
  private eyes: EyePart[] = [];

  private animationFrame: number | null = null;
  private currentState: RobotState = 'idle';
  private time = 0;

  constructor(container: HTMLElement, options: Robot3DOptions = {}) {
    console.log('[Robot3D] Constructor called:', { container, containerSize: { width: container.clientWidth, height: container.clientHeight }, options });

    this.container = container;
    this.options = {
      size: 80,
      color: '#0EA5E9', // 科幻蓝
      eyeColor: '#0F172A', // 深空蓝黑
      animationSpeed: 1,
      quality: 'medium',
      ...options,
    };

    this.scene = new THREE.Scene();
    this.scene.background = null;

    const aspect = container.clientWidth / container.clientHeight;
    console.log('[Robot3D] Camera aspect:', aspect, 'container size:', container.clientWidth, 'x', container.clientHeight);
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    this.camera.position.set(0, 0, 3.5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: this.options.quality !== 'low',
      premultipliedAlpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0); // 完全透明

    console.log('[Robot3D] Renderer created, canvas size:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);

    // 设置 Canvas 样式确保透明，并添加调试边框
    this.renderer.domElement.style.background = 'transparent';
    this.renderer.domElement.style.border = '1px solid rgba(0, 0, 255, 0.3)';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';

    this.robot = new THREE.Group();
    this.createRobot();
    this.scene.add(this.robot);

    // 灯光
    this.setupLights();

    container.appendChild(this.renderer.domElement);

    console.log('[Robot3D] Canvas appended to container');

    this.animate();

    // 窗口大小变化
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * 创建完整的人形机器人
   */
  private createRobot(): void {
    // 创建头部
    this.createHead();

    // 创建身体
    this.createBody();

    // 创建手臂
    this.createArms();

    // 创建腿部
    this.createLegs();

    // 将机器人添加到场景
    this.scene.add(this.robot);

    // 调试：输出机器人边界
    const box = new THREE.Box3().setFromObject(this.robot);
    console.log('[Robot3D] Robot bounds:', {
      min: box.min,
      max: box.max,
      size: new THREE.Vector3().subVectors(box.max, box.min),
      center: new THREE.Vector3().addVectors(box.min, box.max).multiplyScalar(0.5)
    });
  }

  /**
   * 创建头部 - 球形太空头盔风格（参考热门 Three.js 机器人设计）
   */
  private createHead(): void {
    // 头部主体 - 完美球体（太空头盔风格）
    const headRadius = 0.35;
    const headGeometry = new THREE.SphereGeometry(headRadius, 32, 32);

    // 白色头盔外壳 - 半透明质感
    const headMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: false,
    });

    this.head = new THREE.Mesh(headGeometry, headMaterial);
    // 头部位置：在身体正上方
    this.head.position.y = 1.1;
    this.robot.add(this.head);

    // 黑色面罩（ visor 风格）- 只覆盖脸部上半部分
    const visorGeometry = new THREE.SphereGeometry(0.31, 32, 32);
    const visorMaterial = new THREE.MeshStandardMaterial({
      color: 0x0A0A15,
      roughness: 0.05,
      metalness: 0.9,
      emissive: 0x0A0A15,
      emissiveIntensity: 0.05,
    });

    const visor = new THREE.Mesh(visorGeometry, visorMaterial);
    visor.position.set(0, -0.05, 0.25);
    visor.scale.set(1, 0.6, 0.2);
    this.head.add(visor);

    // 创建发光眼睛 - 在面罩前方
    this.createGlowingEyes();

    // 顶部天线（简化）
    this.createAntenna();
  }

  /**
   * 创建发光眼睛 - 太空头盔风格（灵动版）
   */
  private createGlowingEyes(): void {
    if (!this.head) return;

    // 左眼组 - 放在头部前方
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.1, 0.08, 0.33);
    this.head.add(leftEyeGroup);

    // 右眼组
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.1, 0.08, 0.33);
    this.head.add(rightEyeGroup);

    // 眼白基底 - 淡蓝色半透明
    const eyeBaseMaterial = new THREE.MeshBasicMaterial({
      color: 0xE0F4FF,
      transparent: true,
      opacity: 0.4,
    });
    const eyeBaseGeometry = new THREE.SphereGeometry(0.045, 24, 24);
    eyeBaseGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1.5, 0.6));

    const leftBase = new THREE.Mesh(eyeBaseGeometry, eyeBaseMaterial);
    leftBase.renderOrder = 2;
    leftEyeGroup.add(leftBase);

    const rightBase = new THREE.Mesh(eyeBaseGeometry, eyeBaseMaterial);
    rightBase.renderOrder = 2;
    rightEyeGroup.add(rightBase);

    // 虹膜 - 蓝色发光
    const irisMaterial = new THREE.MeshBasicMaterial({
      color: 0x00D4FF,
      transparent: true,
      opacity: 1.0,
    });
    const irisGeometry = new THREE.SphereGeometry(0.03, 24, 24);
    irisGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1.5, 0.5));

    const leftIris = new THREE.Mesh(irisGeometry, irisMaterial);
    leftIris.position.z = 0.02;
    leftIris.renderOrder = 3;
    leftEyeGroup.add(leftIris);
    this.eyes.push({ group: leftEyeGroup, iris: leftIris, base: leftBase });

    const rightIris = new THREE.Mesh(irisGeometry, irisMaterial);
    rightIris.position.z = 0.02;
    rightIris.renderOrder = 3;
    rightEyeGroup.add(rightIris);
    this.eyes.push({ group: rightEyeGroup, iris: rightIris, base: rightBase });

    // 瞳孔 - 深蓝色
    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: 0x0A3D5A,
    });
    const pupilGeometry = new THREE.SphereGeometry(0.015, 16, 16);
    pupilGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1.5, 0.5));

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.z = 0.03;
    leftPupil.renderOrder = 4;
    leftEyeGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.z = 0.03;
    rightPupil.renderOrder = 4;
    rightEyeGroup.add(rightPupil);

    // 高光点 - 让眼睛更有神
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
    });
    const highlightGeometry = new THREE.SphereGeometry(0.008, 8, 8);

    const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    leftHighlight.position.set(0.006, 0.008, 0.04);
    leftHighlight.renderOrder = 5;
    leftEyeGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    rightHighlight.position.set(0.006, 0.008, 0.04);
    rightHighlight.renderOrder = 5;
    rightEyeGroup.add(rightHighlight);

    // 外光晕
    const glowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    glowGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1.6, 0.8));
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00A8FF,
      transparent: true,
      opacity: 0.25,
    });

    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    leftGlow.position.z = -0.005;
    leftGlow.renderOrder = 1;
    leftEyeGroup.add(leftGlow);

    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    rightGlow.position.z = -0.005;
    rightGlow.renderOrder = 1;
    rightEyeGroup.add(rightGlow);

    // 眼睑
    this.createEyelids();
  }

  /**
   * 创建眼睑
   */
  private createEyelids(): void {
    if (!this.head) return;

    const eyelidGeometry = new THREE.SphereGeometry(0.048, 20, 20);
    eyelidGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1.3, 0.2, 0.7));
    const eyelidMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });

    const leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    leftEyelid.position.set(-0.1, 0.11, 0.325);
    leftEyelid.name = 'leftEyelid';
    leftEyelid.renderOrder = 6;
    this.head.add(leftEyelid);

    const rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
    rightEyelid.position.set(0.1, 0.11, 0.325);
    rightEyelid.name = 'rightEyelid';
    rightEyelid.renderOrder = 6;
    this.head.add(rightEyelid);
  }

  /**
   * 创建顶部天线
   */
  private createAntenna(): void {
    if (!this.head) return;

    // 天线杆
    const antennaGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 16);
    const antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x1E3A5F,
      roughness: 0.3,
      metalness: 0.7,
    });

    const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
    antenna.position.set(0, 0.23, 0);
    this.head.add(antenna);

    // 天线顶端小球
    const ballGeometry = new THREE.SphereGeometry(0.025, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0x00D4FF,
      roughness: 0.1,
      metalness: 0.8,
      emissive: 0x00D4FF,
      emissiveIntensity: 0.4,
    });

    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0.06, 0);
    antenna.add(ball);
  }

  /**
   * 创建身体 - 流线型太空机器人身体
   */
  private createBody(): void {
    // 白色身体主体 - 球形 + 圆柱组合
    const bodyGeometry = new THREE.SphereGeometry(0.28, 32, 32);
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    });

    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.position.y = 0.55;
    this.robot.add(this.body);

    // 胸部发光核心 - 圆形反应堆风格
    const coreGeometry = new THREE.CircleGeometry(0.1, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00D4FF,
      transparent: true,
      opacity: 0.9,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.set(0, 0.05, 0.24);
    this.body.add(core);

    // 核心外环
    const ringGeometry = new THREE.RingGeometry(0.1, 0.13, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00A8FF,
      transparent: true,
      opacity: 0.6,
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(0, 0.05, 0.245);
    this.body.add(ring);

    // 颈部连接
    const neckGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.15, 24);
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0xE0E0E0,
      roughness: 0.3,
      metalness: 0.5,
    });
    const neck = new THREE.Mesh(neckGeometry, neckMaterial);
    neck.position.set(0, 0.32, 0);
    this.body.add(neck);
  }

  /**
   * 创建手臂 - 流线型太空机器人手臂
   */
  private createArms(): void {
    if (!this.body) return;

    // 手臂材质
    const armMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 0.3,
    });

    // 关节材质
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x3A4A5A,
      roughness: 0.2,
      metalness: 0.7,
    });

    // 左手臂 - 从肩膀位置伸出
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.35, 0.75, 0);

    // 上臂
    const upperArmGeometry = new THREE.CapsuleGeometry(0.065, 0.25, 16, 24);
    const leftUpperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
    leftUpperArm.rotation.z = Math.PI / 12;
    leftUpperArm.position.y = -0.08;
    this.leftArm.add(leftUpperArm);

    // 肘部关节
    const elbowGeometry = new THREE.SphereGeometry(0.08, 20, 20);
    const elbow = new THREE.Mesh(elbowGeometry, jointMaterial);
    elbow.position.y = -0.18;
    this.leftArm.add(elbow);

    // 前臂
    const forearmGeometry = new THREE.CapsuleGeometry(0.055, 0.2, 16, 24);
    const forearm = new THREE.Mesh(forearmGeometry, armMaterial);
    forearm.position.y = -0.28;
    forearm.rotation.z = -Math.PI / 24;
    this.leftArm.add(forearm);

    // 手部 - 球形
    const handGeometry = new THREE.SphereGeometry(0.07, 20, 20);
    const hand = new THREE.Mesh(handGeometry, armMaterial);
    hand.position.set(0, -0.38, 0.02);
    this.leftArm.add(hand);

    this.body.add(this.leftArm);

    // 右手臂
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.35, 0.75, 0);

    const rightUpperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
    rightUpperArm.rotation.z = -Math.PI / 12;
    rightUpperArm.position.y = -0.08;
    this.rightArm.add(rightUpperArm);

    const rightElbow = new THREE.Mesh(elbowGeometry, jointMaterial);
    rightElbow.position.y = -0.18;
    this.rightArm.add(rightElbow);

    const rightForearm = new THREE.Mesh(forearmGeometry, armMaterial);
    rightForearm.position.y = -0.28;
    rightForearm.rotation.z = Math.PI / 24;
    this.rightArm.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeometry, armMaterial);
    rightHand.position.set(0, -0.38, 0.02);
    this.rightArm.add(rightHand);

    this.body.add(this.rightArm);
  }

  /**
   * 创建腿部 - 流线型太空机器人腿部
   */
  private createLegs(): void {
    if (!this.body) return;

    // 腿部材质
    const legMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 0.3,
    });

    // 关节材质
    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x3A4A5A,
      roughness: 0.2,
      metalness: 0.7,
    });

    // 左腿 - 从身体底部伸出
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.12, 0.3, 0);

    // 大腿
    const upperLegGeometry = new THREE.CapsuleGeometry(0.08, 0.3, 16, 24);
    const leftUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
    leftUpperLeg.position.y = -0.12;
    this.leftLeg.add(leftUpperLeg);

    // 膝盖关节
    const kneeGeometry = new THREE.SphereGeometry(0.09, 20, 20);
    const knee = new THREE.Mesh(kneeGeometry, jointMaterial);
    knee.position.y = -0.24;
    this.leftLeg.add(knee);

    // 小腿
    const lowerLegGeometry = new THREE.CapsuleGeometry(0.07, 0.28, 16, 24);
    const lowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
    lowerLeg.position.y = -0.38;
    this.leftLeg.add(lowerLeg);

    // 脚部 - 椭圆形
    const footGeometry = new THREE.SphereGeometry(0.085, 24, 24);
    footGeometry.applyMatrix4(new THREE.Matrix4().makeScale(1.2, 0.7, 1.6));
    const foot = new THREE.Mesh(footGeometry, legMaterial);
    foot.position.set(0, -0.52, 0.08);
    this.leftLeg.add(foot);

    this.body.add(this.leftLeg);

    // 右腿
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.12, 0.3, 0);

    const rightUpperLeg = new THREE.Mesh(upperLegGeometry, legMaterial);
    rightUpperLeg.position.y = -0.12;
    this.rightLeg.add(rightUpperLeg);

    const rightKnee = new THREE.Mesh(kneeGeometry, jointMaterial);
    rightKnee.position.y = -0.24;
    this.rightLeg.add(rightKnee);

    const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, legMaterial);
    rightLowerLeg.position.y = -0.38;
    this.rightLeg.add(rightLowerLeg);

    const rightFoot = new THREE.Mesh(footGeometry, legMaterial);
    rightFoot.position.set(0, -0.52, 0.08);
    this.rightLeg.add(rightFoot);

    this.body.add(this.rightLeg);
  }

  /**
   * 设置灯光 - 科幻氛围灯光
   */
  private setupLights(): void {
    // 环境光 - 纯白色，更明亮
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
    this.scene.add(ambientLight);

    // 主光源 - 纯白色，增强亮度
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // 补光 - 淡蓝色科幻感（降低强度）
    const fillLight = new THREE.DirectionalLight(0x60A5FA, 0.25);
    fillLight.position.set(-1, 0, 0.5);
    this.scene.add(fillLight);

    // 边缘光 - 白色突出轮廓
    const rimLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    rimLight.position.set(0, 0.5, -0.5);
    this.scene.add(rimLight);
  }

  /**
   * 动画循环
   */
  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);

    this.time += 0.016 * this.options.animationSpeed;

    // 基础偏移量 - 使机器人视觉居中
    const baseOffsetY = -0.95;

    // 待机动画 - 柔和浮动
    if (this.currentState === 'idle') {
      // 整体上下浮动 - 更柔和（在基础偏移上叠加）
      this.robot.position.y = baseOffsetY + Math.sin(this.time * 1.5) * 0.025;
      // 身体轻微左右摇摆
      this.robot.rotation.y = Math.sin(this.time * 0.6) * 0.05;
      // 身体轻微倾斜
      this.robot.rotation.z = Math.cos(this.time * 0.5) * 0.03;

      // 头部独立动画 - 更生动
      if (this.head) {
        this.head.rotation.y = Math.sin(this.time * 0.4) * 0.06;
        this.head.rotation.x = Math.cos(this.time * 0.3) * 0.04;
      }

      // 手臂自然摆动
      if (this.leftArm) {
        this.leftArm.rotation.z = Math.sin(this.time * 1) * 0.08;
        this.leftArm.rotation.x = Math.cos(this.time * 0.8) * 0.05;
      }
      if (this.rightArm) {
        this.rightArm.rotation.z = -Math.sin(this.time * 1) * 0.08;
        this.rightArm.rotation.x = Math.cos(this.time * 0.8) * 0.05;
      }
    }

    // 拖拽状态 - 晕眩效果
    if (this.currentState === 'dragging') {
      // 保持基础偏移
      this.robot.position.y = baseOffsetY;
      this.robot.rotation.z = Math.sin(this.time * 8) * 0.03;
      // 眼睛旋转
      if (this.head) {
        this.head.rotation.y = Math.sin(this.time * 15) * 0.1;
      }
    }

    // 思考状态 - 手托下巴
    if (this.currentState === 'thinking') {
      // 保持基础偏移
      this.robot.position.y = baseOffsetY;
      if (this.head) {
        this.head.rotation.x = Math.sin(this.time * 0.4) * 0.08;
        this.head.rotation.z = Math.cos(this.time * 0.3) * 0.04;
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = Math.PI / 2 + Math.sin(this.time * 0.4) * 0.08;
        this.rightArm.rotation.z = -0.25;
      }
    }

    // 说话状态 - 兴奋摆动
    if (this.currentState === 'speaking') {
      // 保持基础偏移
      this.robot.position.y = baseOffsetY;
      this.robot.rotation.z = Math.sin(this.time * 6) * 0.025;
      if (this.leftArm) {
        this.leftArm.rotation.x = Math.sin(this.time * 5) * 0.15;
      }
      if (this.rightArm) {
        this.rightArm.rotation.x = Math.sin(this.time * 5 + Math.PI) * 0.15;
      }
      // 头部轻微点动
      if (this.head) {
        this.head.rotation.x = Math.sin(this.time * 8) * 0.05;
      }
    }

    // 监听状态 - 前倾专注
    if (this.currentState === 'listening') {
      // 保持基础偏移
      this.robot.position.y = baseOffsetY;
      this.robot.rotation.x = Math.sin(this.time * 0.25) * 0.04;
    }

    // 更新发光效果
    this.updateGlowEffects();

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * 更新发光效果 - 根据状态调整眼睛亮度
   */
  private updateGlowEffects(): void {
    if (!this.head) return;

    // 实现自然眨眼动画 - 使用更频繁的眨眼周期
    const blinkCycle = Math.sin(this.time * 3);
    const blinkThreshold = 0.97; // 提高阈值，让眨眼更短暂
    const isBlinking = blinkCycle > blinkThreshold;

    // 获取眼睑
    const leftEyelid = this.head.getObjectByName('leftEyelid');
    const rightEyelid = this.head.getObjectByName('rightEyelid');

    // 眨眼动画 - 眼睑上下移动
    if (leftEyelid && rightEyelid) {
      const eyelidOpenY = 0.06;
      const eyelidClosedY = 0.02;
      const eyelidTargetY = isBlinking ? eyelidClosedY : eyelidOpenY;

      // 平滑过渡
      leftEyelid.position.y += (eyelidTargetY - leftEyelid.position.y) * 0.3;
      rightEyelid.position.y += (eyelidTargetY - rightEyelid.position.y) * 0.3;
    }

    // 更新眼睛 - 灵动的瞳孔移动和缩放
    this.eyes.forEach(eye => {
      const irisMaterial = eye.iris.material as THREE.MeshBasicMaterial;

      // 基础闪烁效果 - 让眼睛有呼吸感
      const pulse = 1 + Math.sin(this.time * 2) * 0.03;

      // 瞳孔随时间轻微移动，增加灵动感
      const lookX = Math.sin(this.time * 1.5) * 0.015;
      const lookY = Math.cos(this.time * 1.2) * 0.01;

      switch (this.currentState) {
        case 'listening':
          // 监听时眼睛放大 - 好奇表情
          eye.iris.scale.set(1.3 * pulse, 1.3 * pulse, 1);
          eye.iris.position.set(lookX, lookY + 0.02, 0.02);
          irisMaterial.opacity = 1.0;
          break;

        case 'thinking':
          // 思考时眼睛眯起
          eye.iris.scale.set(1 * pulse, 0.4, 1);
          eye.iris.position.set(lookX * 0.5, 0, 0.02);
          irisMaterial.opacity = 0.8;
          break;

        case 'speaking':
          // 说话时眼睛活跃
          const activeScale = 0.9 + Math.sin(this.time * 6) * 0.1;
          eye.iris.scale.set(activeScale * pulse, activeScale, 1);
          eye.iris.position.set(lookX, lookY, 0.02);
          irisMaterial.opacity = isBlinking ? 0.3 : 1.0;
          break;

        case 'dragging':
          // 拖拽时晕眩 - 眼睛旋转效果
          eye.iris.scale.set(0.7, 0.7, 1);
          eye.iris.position.set(
            Math.sin(this.time * 10) * 0.02,
            Math.cos(this.time * 10) * 0.02,
            0.02
          );
          irisMaterial.opacity = 0.6;
          break;

        case 'idle':
        default:
          // 待机时自然张望 + 眨眼
          if (isBlinking) {
            eye.iris.scale.set(0.2, 0.2, 1);
            irisMaterial.opacity = 0;
          } else {
            eye.iris.scale.set(pulse, pulse, 1);
            eye.iris.position.set(lookX, lookY, 0.02);
            irisMaterial.opacity = 1.0;
          }
          break;
      }
    });
  }

  /**
   * 设置状态
   */
  setState(state: RobotState): void {
    this.currentState = state;
  }

  /**
   * 获取状态
   */
  getState(): RobotState {
    return this.currentState;
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  };

  /**
   * 设置颜色
   */
  setColor(color: string): void {
    const materialColor = new THREE.Color(color);
    const eyeColorNum = new THREE.Color(this.options.eyeColor).getHex();

    if (this.head) {
      const material = this.head.material as THREE.MeshStandardMaterial;
      if (material) material.color.set(materialColor);
    }
    if (this.body) {
      const material = this.body.material as THREE.MeshStandardMaterial;
      if (material) material.color.set(materialColor);
    }
    if (this.leftArm) {
      this.leftArm.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material && material.color.getHex() !== eyeColorNum) {
            material.color.set(materialColor);
          }
        }
      });
    }
    if (this.rightArm) {
      this.rightArm.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material && material.color.getHex() !== eyeColorNum) {
            material.color.set(materialColor);
          }
        }
      });
    }
    if (this.leftLeg) {
      this.leftLeg.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material && material.color.getHex() !== eyeColorNum) {
            material.color.set(materialColor);
          }
        }
      });
    }
    if (this.rightLeg) {
      this.rightLeg.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material && material.color.getHex() !== eyeColorNum) {
            material.color.set(materialColor);
          }
        }
      });
    }

    this.options.color = color;
  }

  /**
   * 获取 DOM 元素
   */
  getDOMElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    window.removeEventListener('resize', this.handleResize);

    // 清理 Three.js 资源
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    this.renderer.dispose();

    this.container.removeChild(this.renderer.domElement);
  }
}
