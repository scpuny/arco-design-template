import type { Router, LocationQueryRaw } from 'vue-router';
import NProgress from 'nprogress'; // progress bar

import { useUserStore } from '@/store';

/**
 * 会话模式守卫（模板后端 cookie 会话）：
 * - 不再用 localStorage token 判断登录（isLogin 已废弃）
 * - 未登录：拉取用户信息失败 → 跳 /login 并带 redirect
 * - 已登录：正常放行
 * 登录状态由后端会话决定，前端不做本地 token。
 */
export default function setupUserLoginInfoGuard(router: Router) {
  router.beforeEach(async (to, from, next) => {
    NProgress.start();
    const userStore = useUserStore();
    // 登录页本身不需要会话检测（后端 /login 渲染）
    if (to.name === 'login') {
      NProgress.done();
      next();
      return;
    }
    // 已持有会话：直接放行
    if (userStore.role) {
      next();
      return;
    }
    // 未持有会话：探测一次（cookie 会话 / mock 演示会话）
    try {
      await userStore.info();
    } catch {
      /* 探测失败（401 / 会话失效）走下方统一拦截 */
    }
    // 探测后仍未拿到 role = 未登录 → 一律拦截，带 redirect 回跳登录页。
    // 模板口径：没有登录不允许进入任何业务页（含默认首页）。
    if (!userStore.role) {
      NProgress.done();
      next({
        name: 'login',
        query: {
          redirect: to.fullPath,
        } as LocationQueryRaw,
      });
      return;
    }
    next();
  });
}