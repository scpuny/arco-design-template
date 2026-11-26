import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 结果页面：成功 / 失败。 */
const RESULT: AppRouteRecordRaw = {
  path: '/result',
  name: 'result',
  redirect: '/result/success',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.result',
    requiresAuth: true,
    icon: 'icon-check-circle',
    app: 'default',
    order: 3,
  },
  children: [
    {
      path: 'success',
      name: 'ResultSuccess',
      component: () => import('@/views/result/success/index.vue'),
      meta: { locale: 'menu.result.success', requiresAuth: true, icon: 'icon-check-circle' },
    },
    {
      path: 'error',
      name: 'ResultError',
      component: () => import('@/views/result/error/index.vue'),
      meta: { locale: 'menu.result.error', requiresAuth: true, icon: 'icon-close' },
    },
  ],
};

export default RESULT;
