/**
 * 系统接入配置 —— 新系统复制本模板后，优先改这里。
 *
 * 这里集中了「品牌 + 认证协议 + 字典归属 + 默认首页」四处最容易与业务绑定的参数。
 * 其余能力（主题、菜单、权限、i18n、请求拦截）均从此处或各自 config 读取，
 * 不需要再到组件里翻找硬编码。
 */
export const appConfig = {
  /** 浏览器标题、顶栏/侧栏默认品牌（未接品牌接口时使用） */
  title: 'Arco Design Template',
  shortTitle: 'ADT',
  description: '基于 Vue 3 + Arco Design 的企业管理后台模板',
  copyright: `© ${new Date().getFullYear()} Arco Design Template`,

  /** 顶部应用分组 key；路由用 meta.app 归属，未标记时归入此 key */
  defaultAppKey: 'default',
  /** 字典默认应用标识（sys_app.code），字典组件未显式传 app 时使用 */
  dictApp: 'default',

  /** 认证协议：默认 Spring Security 会话制（cookie + XSRF） */
  auth: {
    /** 登录页路径（SPA 渲染，表单 POST 到 loginPath） */
    loginPath: '/login',
    logoutPath: '/logout',
    profilePath: '/api/auth/profile',
    permissionsPath: '/api/auth/permissions',
    appsPath: '/api/auth/apps',
    csrfCookie: 'XSRF-TOKEN',
    csrfHeader: 'X-XSRF-TOKEN',
    /** 原生表单登录时随表单提交的 CSRF 字段名 */
    csrfField: '_csrf',
  },

  /**
   * Mock 服务（模板默认开启，因为模板本身不带后端）。
   *
   * 接真实后端时在 .env 里设 `VITE_USE_MOCK=false`，全部请求立即走真实接口；
   * 也可以在开发期保留 mock、只替换个别端点（见 src/mock/index.ts 的路由表）。
   */
  mock: {
    enabled: import.meta.env.VITE_USE_MOCK !== 'false',
    /** 演示账号：登录页输入 admin / 123456 即可（退出后可见） */
    username: 'admin',
    password: '123456',
    /** 模拟网络延迟（毫秒），设为 0 可关闭 */
    latency: 120,
    /** 是否预置一个已登录会话：true 打开即进工作台，false 先看到登录页（模板要求未登录不得进入，默认 false） */
    presetLoggedIn: false,
  },
} as const;

export type AppConfig = typeof appConfig;
