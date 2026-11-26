import { createRouter, createWebHistory } from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css';

import { appRoutes } from './routes';
import { REDIRECT_MAIN, NOT_FOUND_ROUTE } from './routes/base';
import createRouteGuard from './guard';

NProgress.configure({ showSpinner: false }); // NProgress Configuration

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: 'login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/index.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    ...appRoutes,
    REDIRECT_MAIN,
    NOT_FOUND_ROUTE,
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

createRouteGuard(router);

// 部署新版本后，旧标签页持有的 chunk 哈希已失效：按需加载路由组件会 404，
// 配合 <Transition mode="out-in"> 会让后续所有路由渲染成空白页，只能手动刷新。
// 这里对「动态模块加载失败」做一次自动整页跳转（带防循环保护），把白屏变成无感自愈。
router.onError((error, to) => {
  const msg = String((error as Error)?.message || error);
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    const key = 'adt:chunk-reload';
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last > 3000) {
      sessionStorage.setItem(key, String(Date.now()));
      window.location.replace(to?.fullPath || window.location.href);
    }
  }
});

// vite 预加载（modulepreload）失败同样按需自愈
window.addEventListener('vite:preloadError', () => {
  const key = 'adt:chunk-reload';
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 3000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

export default router;
