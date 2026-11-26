import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/** 个人中心：资料 / 安全 / 通知偏好 / 登录设备，全部数据走 mock。 */
const USER: AppRouteRecordRaw = {
  path: '/user',
  name: 'user',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.user',
    requiresAuth: true,
    icon: 'icon-user',
    app: 'default',
    order: 7,
  },
  children: [
    {
      path: '',
      name: 'UserCenter',
      component: () => import('@/views/user/index.vue'),
      meta: {
        locale: 'menu.user',
        requiresAuth: true,
        icon: 'icon-user',
      },
    },
  ],
};

export default USER;
