import { ref } from 'vue';
import { appConfig } from './app-config';

/**
 * 顶部应用分组定义（menuMode: 'mix' 时生效）：
 * - 路由通过 `meta.app` 归属应用；未标记时归入 {@link PLATFORM_APP_KEY}。
 * - 数组顺序 = 顶部导航顺序；第一个应用决定默认首页。
 * - 无可见菜单的应用自动隐藏。
 *
 * 新系统若需要多应用分组，在这里增加条目并在路由 meta.app 里引用对应 key。
 */
export interface AppDef {
  /** 应用标识，与路由 meta.app 对应 */
  key: string;
  /** 菜单文案 i18n key */
  locale: string;
  /** 顶部导航图标（Arco 图标名） */
  icon: string;
  /** 服务端下发的直显文案（优先于 locale） */
  label?: string;
}

/** 未显式标记 meta.app 的路由默认归入该应用 */
export const PLATFORM_APP_KEY = appConfig.defaultAppKey;

/** 静态兜底应用列表：服务端下发失败或为空时保持兜底，避免导航空白 */
export const APPS: AppDef[] = [
  { key: PLATFORM_APP_KEY, locale: 'menu.app.default', icon: 'icon-apps' },
];

const runtimeApps = ref<AppDef[] | null>(null);

/** 接收服务端下发的导航列表（[{key,name,icon,sort}]，已排序） */
export function applyServerApps(
  list:
    | { key?: string; name?: string; icon?: string; sort?: number }[]
    | null
    | undefined
) {
  if (!Array.isArray(list) || list.length === 0) return;
  const mapped = list
    .filter((it) => it && typeof it.key === 'string' && it.key)
    .map((it) => ({
      key: String(it.key),
      locale: `menu.app.${it.key}`,
      label: it.name || undefined,
      icon: it.icon || 'icon-apps',
    }));
  if (mapped.length) runtimeApps.value = mapped;
}

/** 当前生效的应用列表：服务端下发优先，静态兜底 */
export function activeApps(): AppDef[] {
  return runtimeApps.value ?? APPS;
}

/** 登出时清空运行时覆盖 */
export function resetServerApps() {
  runtimeApps.value = null;
}
