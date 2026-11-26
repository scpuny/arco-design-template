import { resolve } from 'path';
import { loadEnv, mergeConfig, type Plugin } from 'vite';
import eslint from 'vite-plugin-eslint';
import baseConfig from './vite.config.base';

// 后端地址由 .env.development 的 VITE_DEV_BACKEND 指定，避免业务端口写死在构建配置里
const env = loadEnv('development', resolve(__dirname, '..'), 'VITE_');
const BACKEND = env.VITE_DEV_BACKEND || 'http://localhost:8080';

/**
 * dev 专用：为 SPA 登录页播种 CSRF cookie。
 *
 * 会话制后端通常只在「请求经过登录链」时下发 XSRF-TOKEN。开发环境由 vite
 * 直接渲染 /login（保留 HMR），路由守卫跳过会话探测，刷新登录页拿不到
 * cookie，提交表单必 403。这里按需向后端取一次 cookie 并透传。
 * 使用 JWT 的系统可整段删除本插件。
 */
function csrfSeedPlugin(): Plugin {
  return {
    name: 'adt-dev-csrf-seed',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET') return next();
        const pathname = (req.url || '').split('?')[0];
        if (pathname !== '/login' && pathname !== '/login/') return next();
        if (/(^|; )XSRF-TOKEN=/.test(req.headers.cookie || '')) return next();
        try {
          const upstream = await fetch(`${BACKEND}/login`, {
            headers: { accept: 'text/html' },
            redirect: 'manual',
          });
          const cookies = upstream.headers.getSetCookie?.() ?? [];
          if (cookies.length) res.setHeader('set-cookie', cookies);
        } catch {
          /* 后端未启动时忽略，交由 vite 正常渲染 */
        }
        next();
      });
    },
  };
}

export default mergeConfig(
  {
    mode: 'development',
    server: {
      open: false,
      port: 3001,
      host: '0.0.0.0',
      proxy: {
        // changeOrigin: false 保留原始 Host，避免后端 302 生成后端绝对地址跳出 dev server
        '/api': { target: BACKEND, changeOrigin: false },
        '/logout': { target: BACKEND, changeOrigin: false },
        '/login': {
          target: BACKEND,
          changeOrigin: false,
          bypass(req) {
            if (req.method === 'POST') return undefined;
            const pathname = (req.url || '').split('?')[0];
            // GET /login 交给 vite 提供 SPA 登录页；其余 /login/* 走后端
            if (pathname === '/login' || pathname === '/login/') return req.url;
            return undefined;
          },
        },
      },
      fs: { strict: true },
    },
    plugins: [
      csrfSeedPlugin(),
      eslint({
        cache: false,
        include: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.vue'],
        exclude: ['node_modules'],
        failOnError: false,
        failOnWarning: false,
      }),
    ],
  },
  baseConfig
);
