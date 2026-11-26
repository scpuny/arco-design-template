import { computed } from 'vue';
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { activeApps, PLATFORM_APP_KEY } from '@/config/apps';
import type { AppDef } from '@/config/apps';
import useMenuTree from './use-menu-tree';

export interface AppGroup extends AppDef {
  /** 该应用下当前用户可见的一级菜单（已按 order 排序、已按权限点过滤） */
  routes: RouteRecordRaw[];
}

/** 当前路由归属的应用 key（取路由链路最外层的 meta.app；未标记时归入平台管理） */
export function resolveAppKey(
  route?: RouteLocationNormalizedLoaded | { matched?: unknown[] } | null
): string {
  const matched = (route as { matched?: { meta?: { app?: string } }[] })
    ?.matched;
  const meta = matched?.[0]?.meta;
  return meta?.app || PLATFORM_APP_KEY;
}

/**
 * 按应用把菜单树归组：保持生效应用列表顺序（服务端下发优先，静态兜底）；
 * 没有任何可见菜单的应用自动丢弃（不会出现「点进去空无一物」的应用）。
 */
export function groupMenusByApp(tree: RouteRecordRaw[]): AppGroup[] {
  const list = tree || [];
  return activeApps()
    .map((def) => ({
      ...def,
      routes: list.filter((r) => (r.meta?.app || PLATFORM_APP_KEY) === def.key),
    }))
    .filter((g) => g.routes.length > 0);
}

/** 取第一个可访问叶子（menuTree 已过滤 hideInMenu 与无权限项，故取到的即可跳转） */
export function findFirstLeafRoute(
  routes: RouteRecordRaw[]
): RouteRecordRaw | null {
  const list = routes || [];
  for (let i = 0; i < list.length; i += 1) {
    const r = list[i];
    if (r.children && r.children.length) {
      const leaf = findFirstLeafRoute(r.children);
      if (leaf) return leaf;
    } else if (r.name) {
      return r;
    }
  }
  return null;
}

/** 某应用的第一页（顶部导航点击目标）；用 name 跳转，避免相对路径拼接 */
export function firstPageOfApp(
  group?: AppGroup | null
): { name: string } | null {
  const leaf = group ? findFirstLeafRoute(group.routes) : null;
  return leaf?.name ? { name: String(leaf.name) } : null;
}

/**
 * 默认首页：**第一个有可见菜单的应用的第一页**。
 * 守卫场景（无 setup 上下文）直接传 menuTree 使用。
 */
export function resolveDefaultHome(
  menuTree: RouteRecordRaw[]
): { name: string } | null {
  const groups = groupMenusByApp(menuTree);
  return groups.length ? firstPageOfApp(groups[0]) : null;
}

/**
 * 生成「左侧应用菜单」的呈现树（纯展示用途，不新增路由层级）：
 *
 * 1. **单一级项的应用去掉冗余层**：顶部已有应用名，左侧再出现一次同名分组就是重复 → 直接展开其 children。
 * 2. **单子项的一级项提升替换**：如「工作台 › 工作台」，用子项本身替换父项（继承父项图标）。
 *
 * 多子项的一级项保持可折叠分组。
 */
function promoteSingleChild(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return (routes || []).map((r) => {
    const kids = r.children || [];
    if (kids.length === 1 && !(kids[0].children || []).length) {
      const child = kids[0];
      return {
        ...child,
        // 文案沿用子项（页面名）：避免与其它分组项重名造成歧义
        // （如 UserCenter →「个人中心」，若用父项文案会显示成「用户」，与系统管理下的「用户管理」混淆）
        meta: { ...(child.meta || {}), icon: child.meta?.icon || r.meta?.icon },
      } as RouteRecordRaw;
    }
    return r;
  });
}

export function buildAppMenu(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  const list = routes || [];
  if (list.length === 1 && list[0].children?.length) {
    return promoteSingleChild(list[0].children);
  }
  return promoteSingleChild(list);
}

/** 组合式：顶部应用导航 + 当前应用菜单（左侧） */
export default function useAppNav() {
  const router = useRouter();
  const route = useRoute();
  const { menuTree } = useMenuTree();

  const appGroups = computed<AppGroup[]>(() =>
    groupMenusByApp(menuTree.value as RouteRecordRaw[])
  );

  /** 当前应用：由路由链路解析；若该应用对当前用户不可见则回落到第一个应用 */
  const activeAppKey = computed(() => {
    const key = resolveAppKey(route);
    return appGroups.value.some((g) => g.key === key)
      ? key
      : appGroups.value[0]?.key || '';
  });

  const activeApp = computed(() =>
    appGroups.value.find((g) => g.key === activeAppKey.value)
  );

  /** 左侧菜单数据源：当前应用下的菜单树（一级项含其子级） */
  const activeAppMenus = computed<RouteRecordRaw[]>(
    () => activeApp.value?.routes || []
  );

  /** 左侧菜单呈现树（已做单层展开/单子项提升，见 buildAppMenu） */
  const leftMenuTree = computed<RouteRecordRaw[]>(() =>
    buildAppMenu(activeAppMenus.value)
  );

  /** 默认首页（用于「已登录进入 / 或 /login」时定位） */
  const defaultHome = () =>
    firstPageOfApp(appGroups.value[0]) || { name: 'login' };

  /** 默认首页完整路径（供常量兜底/调试） */
  const defaultHomePath = () => {
    const target = firstPageOfApp(appGroups.value[0]);
    return target ? router.resolve(target).fullPath : '';
  };

  return {
    appGroups,
    activeAppKey,
    activeApp,
    activeAppMenus,
    leftMenuTree,
    defaultHome,
    defaultHomePath,
  };
}
