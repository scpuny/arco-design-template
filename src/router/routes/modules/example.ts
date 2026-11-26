import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

/**
 * 示例模块：新增路由模块文件即自动注册（见 routes/index.ts 的 import.meta.glob）。
 * 新系统可直接删除本模块，或把它复制成业务模块。
 */
const EXAMPLE: AppRouteRecordRaw = {
  path: '/example',
  name: 'example',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.example',
    requiresAuth: true,
    icon: 'icon-file',
    app: 'default',
    order: 1,
  },
  children: [
    {
      path: 'list',
      name: 'ExampleList',
      component: () => import('@/views/example/list/index.vue'),
      meta: {
        locale: 'menu.example.list',
        requiresAuth: true,
        icon: 'icon-file',
      },
    },
  ],
};

export default EXAMPLE;
