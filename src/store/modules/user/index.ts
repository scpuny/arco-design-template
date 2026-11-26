import { defineStore } from 'pinia';
import {
  logout as userLogout,
  getUserInfo,
  getNavApps,
  authPermissions,
  loginRequest,
  LoginData,
} from '@/api/user';
import { appConfig } from '@/config/app-config';
import { applyServerApps, resetServerApps } from '@/config/apps';
import { removeRouteListener } from '@/utils/route-listener';
import { UserState } from './types';
import useAppStore from '../app';

const useUserStore = defineStore('user', {
  state: (): UserState => ({
    name: undefined,
    avatar: undefined,
    email: undefined,
    role: '',
    permissions: [],
  }),

  getters: {
    userInfo(state: UserState): UserState {
      return { ...state };
    },
  },

  actions: {
    switchRoles() {
      return new Promise((resolve) => {
        this.role = this.role === 'user' ? 'admin' : 'user';
        resolve(this.role);
      });
    },
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },
    resetInfo() {
      this.$reset();
    },

    /**
     * 会话探测：成功即视为已登录。
     * 新系统只需让 profile 接口返回 { displayName, email, avatar, role }；
     * permissions/apps 两个接口失败时自动降级为静态配置，不影响登录。
     */
    async info() {
      const res = await getUserInfo();
      const data = (res.data || {}) as Record<string, any>;
      const displayName = data.displayName || data.username;
      // 会话探测失败（mock 未登录 / 后端返回空）必须保持未登录态，
      // 否则 role 兜底成 admin 会让路由守卫误判为已登录。
      if (!displayName) {
        this.resetInfo();
        return;
      }
      this.setInfo({
        name: displayName,
        email: data.email,
        avatar: data.avatar,
        role: data.role || 'admin',
      });
      try {
        const perm = await authPermissions();
        this.permissions = perm.data?.permissions || [];
      } catch {
        this.permissions = [];
      }
      try {
        const apps = await getNavApps();
        applyServerApps(apps.data);
      } catch {
        /* 接口失败：沿用 config/apps.ts 的静态兜底 */
      }
    },

    /** 登录：mock 模式走 axios（由 adapter 接管）；真实后端沿用原生表单 POST。 */
    async login(loginForm: LoginData) {
      if (appConfig.mock.enabled) {
        await loginRequest({
          username: loginForm.username,
          password: loginForm.password,
        });
        await this.info();
        // 只接受站内路径，避免 query.redirect 被改成外链
        const target =
          loginForm.redirect?.startsWith('/') &&
          !loginForm.redirect.startsWith(appConfig.auth.loginPath)
            ? loginForm.redirect
            : '/dashboard/console';
        window.location.href = target;
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = appConfig.auth.loginPath;
      form.style.display = 'none';
      const addField = (name: string, value: string) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };
      addField('username', loginForm.username);
      addField('password', loginForm.password);
      const csrf = document.cookie.match(
        new RegExp(`(^|; )${appConfig.auth.csrfCookie}=([^;]+)`)
      )?.[2];
      if (csrf) addField(appConfig.auth.csrfField, decodeURIComponent(csrf));
      document.body.appendChild(form);
      form.submit();
    },

    logoutCallBack() {
      const appStore = useAppStore();
      this.resetInfo();
      removeRouteListener();
      appStore.clearServerMenu();
      resetServerApps();
    },

    async logout() {
      try {
        await userLogout();
      } finally {
        this.logoutCallBack();
      }
    },
  },
});

export default useUserStore;
