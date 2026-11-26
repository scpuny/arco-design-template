/**
 * 路由切换动画偏好 —— 与主题偏好同范式：localStorage 持久化 + reactive 共享。
 *
 * 为什么不放 appStore：Pinia 未接持久化插件，刷新即丢；而动画偏好属于
 * 「外观设置」的长期选择，应与主题/明暗一样跨会话保留。
 *
 * 设置项（对应设置抽屉「页面动画」分组）：
 *   - enabled：切换动画 开关
 *   - type   ：动画类型（渐变 / 闪现 / 滑动 / 消退 / 底部消退 / 缩放消退）
 *
 * 样式定义见 assets/style/global.less 的 .route-* 动画类；
 * page-layout.vue 读取 routeAnimationState 拼出 <transition :name>。
 */
import { reactive } from 'vue';

export type RouteAnimation =
  | 'gradient'
  | 'flash'
  | 'slide'
  | 'fade'
  | 'fadeBottom'
  | 'zoomFade';

export interface RouteAnimationOption {
  value: RouteAnimation;
  labelKey: string;
}

/** 顺序即下拉展示顺序（与设置截图一致） */
export const ROUTE_ANIMATIONS: RouteAnimationOption[] = [
  { value: 'gradient', labelKey: 'settings.routeAnimation.gradient' },
  { value: 'flash', labelKey: 'settings.routeAnimation.flash' },
  { value: 'slide', labelKey: 'settings.routeAnimation.slide' },
  { value: 'fade', labelKey: 'settings.routeAnimation.fade' },
  { value: 'fadeBottom', labelKey: 'settings.routeAnimation.fadeBottom' },
  { value: 'zoomFade', labelKey: 'settings.routeAnimation.zoomFade' },
];

const K_ENABLED = 'adt-route-animation-enabled';
const K_TYPE = 'adt-route-animation-type';
const DEFAULT_TYPE: RouteAnimation = 'fade';

function parseType(v: string | null): RouteAnimation {
  return ROUTE_ANIMATIONS.some((o) => o.value === v)
    ? (v as RouteAnimation)
    : DEFAULT_TYPE;
}

function readState(): { enabled: boolean; type: RouteAnimation } {
  let enabled = localStorage.getItem(K_ENABLED);
  let type = localStorage.getItem(K_TYPE);
  // 兼容旧版单一下拉（旧存储键）：none→关闭，zoom→缩放消退，其余同名
  const legacy = localStorage.getItem('adt-route-animation');
  if (enabled === null && legacy === 'none') enabled = 'false';
  if (type === null && legacy) {
    type = legacy === 'zoom' ? 'zoomFade' : legacy === 'fade' || legacy === 'slide' ? legacy : null;
  }
  return { enabled: enabled !== 'false', type: parseType(type) };
}

interface RouteAnimationState {
  enabled: boolean;
  type: RouteAnimation;
}

/** 全局响应式动画偏好，设置抽屉与路由布局共享 */
export const routeAnimationState = reactive<RouteAnimationState>(readState());

/** 「切换动画」开关：立即生效并持久化 */
export function setRouteAnimationEnabled(enabled: boolean) {
  localStorage.setItem(K_ENABLED, String(enabled));
  routeAnimationState.enabled = enabled;
}

/** 「动画类型」下拉：立即生效并持久化 */
export function setRouteAnimationType(type: RouteAnimation) {
  localStorage.setItem(K_TYPE, type);
  routeAnimationState.type = type;
}
