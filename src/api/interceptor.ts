import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message, Modal } from '@arco-design/web-vue';
import { appConfig } from '@/config/app-config';
import { installMockAdapter, isMockEnabled } from '@/mock';

export interface HttpResponse<T = unknown> {
  status: number;
  msg: string;
  code: number;
  data: T;
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}
axios.defaults.withCredentials = true;

// 请求拦截：cookie 会话模式，写请求自动附 XSRF header
axios.interceptors.request.use((config: AxiosRequestConfig) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = readCookie(appConfig.auth.csrfCookie);
    if (csrf) {
      config.headers = config.headers || {};
      (config.headers as Record<string, string>)[appConfig.auth.csrfHeader] =
        csrf;
    }
  }
  return config;
});

// ---- 401 → 静默重检会话（单飞）→ 仍 401 → 弹窗 + 跳登录 ----
let sessionRefreshing: Promise<boolean> | null = null;
let expiredModalShown = false;
let expiredModal: { close: () => void } | null = null;

function tryRefreshSession(): Promise<boolean> {
  if (!sessionRefreshing) {
    sessionRefreshing = axios
      .get(appConfig.auth.profilePath, { _isRefresh: true } as AxiosRequestConfig)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        sessionRefreshing = null;
      });
  }
  return sessionRefreshing;
}

function dismissExpiredModal() {
  expiredModalShown = false;
  try {
    expiredModal?.close();
  } catch {
    /* 已关闭则忽略 */
  }
  expiredModal = null;
}

function gotoLogin() {
  if (location.pathname.startsWith(appConfig.auth.loginPath)) return;
  location.href = appConfig.auth.loginPath;
}

function handleSessionExpired() {
  if (expiredModalShown || location.pathname.startsWith(appConfig.auth.loginPath))
    return;
  expiredModalShown = true;
  expiredModal = Modal.warning({
    title: '登录已过期',
    content: '您的登录状态已失效，请重新登录。',
    hideCancel: true,
    okText: '重新登录',
    onOk: () => {
      dismissExpiredModal();
      gotoLogin();
    },
  }) as unknown as { close: () => void };
  window.setTimeout(() => {
    if (expiredModalShown) {
      dismissExpiredModal();
      gotoLogin();
    }
  }, 3000);
}

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const status = error.response?.status;
    const cfg = (error.config || {}) as AxiosRequestConfig & {
      _isRefresh?: boolean;
      _retried?: boolean;
      /** 调用方自行处理错误，不弹全局提示 */
      _silent?: boolean;
    };
    if (status === 401) {
      if (
        cfg._isRefresh ||
        cfg._retried ||
        location.pathname.startsWith(appConfig.auth.loginPath)
      ) {
        handleSessionExpired();
        return Promise.reject(error);
      }
      return tryRefreshSession().then((ok) => {
        if (!ok) {
          handleSessionExpired();
          return Promise.reject(error);
        }
        cfg._retried = true;
        return axios(cfg);
      });
    }
    if (cfg._silent) return Promise.reject(error);
    if (status === 403 || (status && status !== 0)) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (status === 403 ? '没有权限执行该操作' : `请求失败 (${status})`);
      Message.error({ content: String(msg), duration: 3 * 1000 });
    }
    return Promise.reject(error);
  }
);

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[2]) : null;
}

// 模板无后端：在 axios adapter 层接管全部请求；VITE_USE_MOCK=false 时不安装，
// 业务代码和拦截器无需任何改动即可切换到真实后端。
if (isMockEnabled()) {
  installMockAdapter();
}
