import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/**
 * 主控台：参考 Arco Admin Console 的数据看板（全部数据来自 mock 接口）。
 * /dashboard/workplace：工作台页（问候 + 项目卡 + 最近动态 + 快捷入口，数据来自 mock）。
 */
const DASHBOARD: AppRouteRecordRaw = {
  path: '/dashboard',
  name: 'dashboard',
  redirect: '/dashboard/console',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.dashboard',
    requiresAuth: true,
    icon: 'icon-dashboard',
    app: 'default',
    order: 0,
  },
  children: [
    {
      path: 'console',
      name: 'Console',
      component: () => import('@/views/dashboard/workplace/console.vue'),
      meta: {
        locale: 'menu.dashboard.console',
        requiresAuth: true,
        icon: 'icon-bar-chart',
      },
    },
    {
      // 工作台页（参考 Naive Admin Workplace）：问候 + 项目卡 + 最近动态 + 快捷入口，全部走 mock
      path: 'workplace',
      name: 'Workplace',
      component: () => import('@/views/dashboard/workplace/index.vue'),
      meta: {
        locale: 'menu.dashboard.workplace',
        requiresAuth: true,
        icon: 'icon-apps',
      },
    },
    {
      // 监控中心（参考 Naive Admin Monitor）：服务器信息 + CPU/内存/磁盘 + 进程，走 mock
      path: 'monitor',
      name: 'Monitor',
      component: () => import('@/views/dashboard/workplace/monitor.vue'),
      meta: {
        locale: 'menu.dashboard.monitor',
        requiresAuth: true,
        icon: 'icon-thunderbolt',
      },
    },
  ],
};

export default DASHBOARD;