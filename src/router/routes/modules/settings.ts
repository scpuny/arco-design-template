import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 设置页面：表单读写走 mock。 */
const SETTINGS: AppRouteRecordRaw = {
  path: '/settings',
  name: 'settingsPage',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.settings',
    requiresAuth: true,
    icon: 'icon-menu',
    app: 'default',
    order: 5,
  },
  children: [
    {
      path: '',
      name: 'Settings',
      component: () => import('@/views/settings/index.vue'),
      meta: { locale: 'menu.settings', requiresAuth: true, icon: 'icon-settings' },
    },
  ],
};

export default SETTINGS;
