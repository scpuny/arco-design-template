import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 系统管理：通用管理页示例，数据来自 mock。 */
const SYSTEM: AppRouteRecordRaw = {
  path: '/system',
  name: 'system',
  redirect: '/system/user',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.system',
    requiresAuth: true,
    icon: 'icon-settings',
    app: 'default',
    order: 1,
  },
  children: [
    {
      path: 'user',
      name: 'SystemUser',
      component: () => import('@/views/system/user/index.vue'),
      meta: { locale: 'menu.system.user', requiresAuth: true, icon: 'icon-user' },
    },
    {
      path: 'role',
      name: 'SystemRole',
      component: () => import('@/views/system/role/index.vue'),
      meta: { locale: 'menu.system.role', requiresAuth: true, icon: 'icon-storage' },
    },
    {
      path: 'dict',
      name: 'SystemDict',
      component: () => import('@/views/system/dict/index.vue'),
      meta: { locale: 'menu.system.dict', requiresAuth: true, icon: 'icon-list' },
    },
    {
      // 操作日志（参考 Naive Admin Logs）：筛选 + 列表 + 详情抽屉，走 mock
      path: 'logs',
      name: 'SystemLogs',
      component: () => import('@/views/system/logs/index.vue'),
      meta: { locale: 'menu.system.logs', requiresAuth: true, icon: 'icon-file' },
    },
    {
      // 菜单管理（参考 Naive Admin Menu）：树形表格 + 抽屉增改，走 mock
      path: 'menu',
      name: 'SystemMenu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: { locale: 'menu.system.menu', requiresAuth: true, icon: 'icon-apps' },
    },
  ],
};

export default SYSTEM;
