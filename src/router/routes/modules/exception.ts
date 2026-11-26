import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 异常页面：403 / 404 / 500，共用同一组件、按 meta 切换文案。 */
const EXCEPTION: AppRouteRecordRaw = {
  path: '/exception',
  name: 'exception',
  redirect: '/exception/403',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.exception',
    requiresAuth: true,
    icon: 'icon-exclamation',
    app: 'default',
    order: 4,
  },
  children: [
    {
      path: '403',
      name: 'Exception403',
      component: () => import('@/views/exception/index.vue'),
      meta: { locale: 'menu.exception.403', exceptionCode: '403', requiresAuth: true, icon: 'icon-lock' },
    },
    {
      path: '404',
      name: 'Exception404',
      component: () => import('@/views/exception/index.vue'),
      meta: { locale: 'menu.exception.404', exceptionCode: '404', requiresAuth: true, icon: 'icon-question' },
    },
    {
      path: '500',
      name: 'Exception500',
      component: () => import('@/views/exception/index.vue'),
      meta: { locale: 'menu.exception.500', exceptionCode: '500', requiresAuth: true, icon: 'icon-exclamation-circle' },
    },
  ],
};

export default EXCEPTION;
