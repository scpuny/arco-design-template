import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 表单页面：示例表单，提交走 mock。 */
const FORM_PAGE: AppRouteRecordRaw = {
  path: '/form',
  name: 'formPage',
  redirect: '/form/basic',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.form',
    requiresAuth: true,
    icon: 'icon-edit',
    app: 'default',
    order: 2,
  },
  children: [
    {
      path: 'basic',
      name: 'FormBasic',
      component: () => import('@/views/form/basic/index.vue'),
      meta: { locale: 'menu.form.basic', requiresAuth: true, icon: 'icon-file' },
    },
    {
      path: 'steps',
      name: 'FormSteps',
      component: () => import('@/views/form/steps/index.vue'),
      meta: { locale: 'menu.form.steps', requiresAuth: true, icon: 'icon-formula' },
    },
    {
      path: 'advanced',
      name: 'FormAdvanced',
      component: () => import('@/views/form/advanced/index.vue'),
      meta: { locale: 'menu.form.advanced', requiresAuth: true, icon: 'icon-thunderbolt' },
    },
    {
      path: 'detail',
      name: 'FormDetail',
      component: () => import('@/views/form/detail/index.vue'),
      meta: { locale: 'menu.form.detail', requiresAuth: true, icon: 'icon-eye' },
    },
  ],
};

export default FORM_PAGE;
