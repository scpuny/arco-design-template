# arco-design-template

Vue 3 + Arco Design 管理后台模板。从 IDGate 前端剥离通用骨架而成，**不含任何量具 / 流程 / 认证中心业务代码**，可作为新系统的起点直接使用。

## 技术栈

Vite 3 · Vue 3 · TypeScript · Arco Design Vue · Pinia · Vue Router 4 · vue-i18n 9 · Less · ECharts

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:3001
pnpm build      # 类型检查 + 生产构建，产物在 dist/
pnpm type:check
```

**模板自带后端（Mock 服务）**，默认开启：不依赖任何外部服务。打开后**必须先登录才能进入任何业务页**（路由守卫统一拦截，未登录跳登录页并带回跳参数）。演示账号 `admin / 123456`；登录页支持账号密码、手机验证码 `13800138000 / 123456`、第三方登录三种入口。登录后即可看主控台看板、操作用户/角色/字典、填写表单、查看结果与异常页、修改系统设置、看消息、在个人中心改资料/管理登录设备；点顶栏「退出登录」回到登录页。若希望打开即已登录（跳过登录页），把 `app-config.ts` 里 `mock.presetLoggedIn` 改回 `true`。

接真实后端时，在 `.env.development` / `.env.production` 设 `VITE_USE_MOCK=false`（并配置 `VITE_API_BASE_URL`），全部请求立刻走真实接口，业务代码零改动。Mock 的实现与端点清单见下方「Mock 服务」。

## 新系统接入：改这些地方

| 场景 | 文件 |
| --- | --- |
| 品牌标题、认证端点、字典应用 | `src/config/app-config.ts`（**首选入口**） |
| 顶部应用分组（默认单应用） | `src/config/apps.ts` |
| 默认布局 / 主题色 / 是否多页签 | `src/config/settings.json` |
| 新增页面 | `src/router/routes/modules/*.ts` + `src/views/**`（模块文件自动注册） |
| 菜单文案 | `src/locale/{zh-CN,en-US}.ts` 的 `menu.*` 词条 |
| 主题色板 / CSS 变量前缀 | `src/config/themes.ts`（`--adt-*` / `data-theme-adt`） |
| 登录页 / 主控台 | `src/views/login/`、`src/views/dashboard/workplace/console.vue`（数据均走 mock） |
| 个人中心 | `src/views/user/index.vue` + `src/api/user.ts`（资料/安全/通知/设备，数据全走 mock） |
| 通用 CRUD 表格组件 | `src/components/crud-table/index.vue`（配置 columns/fields + endpoint 即得完整增删改查页） |
| Mock 数据与接口 | `src/mock/index.ts`（端点路由表）、`src/mock/dataset.ts`（种子数据） |
| 品牌 LOGO / favicon | `src/assets/logo.svg`（侧栏、顶栏、登录页、favicon 共用；换文件即可全站生效） |

`src/views/dashboard/workplace/console.vue` 是按 Arco Admin Console 实现的主控台看板：4 张统计卡 + 订单来源双轴柱线混合图 + 用户分析 + 最新订单表格 + 消费排行，5 个端点全部来自 mock（`src/api/dashboard.ts`），接真实后端时保持响应结构即可。

内置菜单已按参考站铺开：主控台、示例（列表页）、系统管理（用户/角色/字典）、基础表单、结果页面（成功/失败）、异常页面（403/404/500）、设置页面、个人中心。

`src/views/user/index.vue` 是从 IDGate 搬来的个人中心：左侧用户卡 + 五个分区（基本资料、安全设置、通知偏好、登录设备、我的角色权限），头像上传自动裁剪为小图 data URL，主题偏好接模板主题系统。所有数据走 mock：资料编辑 `PUT {auth.profilePath}`、OAuth 授权列表/撤销、登录设备台账/下线、通知偏好读写，种子数据在 `src/mock/dataset.ts`。

`src/components/crud-table/index.vue` 是配置驱动的通用 CRUD 组件：传入 `endpoint`、`columns`、`fields`，即得到搜索 + 弹窗表单 + 分页 + 删除的完整页面。用户/角色/字典三页各只有 20 行配置，就是它的用例；新业务列表页优先复用它，不要再写一遍表格逻辑。

`src/views/example/list/index.vue` 是一份独立的 CRUD 页范例，数据走 `/api/examples` mock 接口，可直接复制改造。

## 内置能力

- **布局**：侧栏 / 顶栏 / 混合三种模式，移动端抽屉菜单，多页签与路由缓存（`page-layout.vue`）。
- **主题**：6 套色板 × 明暗双模式，CSS 变量驱动，设置抽屉实时切换并持久化。
- **权限**：路由守卫（`requiresAuth` / `roles`）+ `v-permission` 指令 + 用户权限点 store。
- **会话**：cookie 会话 + XSRF 拦截器；401 静默重检单飞，失效弹窗后跳登录。
- **Mock 服务**：axios adapter 层接管全部请求，含登录态、字典、消息读写、主控台看板、用户/角色/字典 CRUD、个人中心（资料/OAuth/设备/通知偏好）、表单提交、设置读写、示例 CRUD；`VITE_USE_MOCK=false` 一键关闭。
- **字典**：`useDictOptions` / `dictTag` 全局缓存，未加载时回退原值。
- **消息**：站内消息浮层（接口在 `src/api/message.ts`，分类展示元数据在 `components/message-box/meta.ts`）。
- **多语言**：中英双语，路由 `meta.locale` 直接作为 i18n key。
- **工程化**：ESLint / Stylelint / Prettier / Husky commitlint / gzip / 打包分析。

## Mock 服务

模板默认 `VITE_USE_MOCK=true`，所有请求在 axios adapter 层由 `src/mock/index.ts` 接管 —— 请求/响应拦截器、CSRF、错误提示链路照常执行，只是不发网络请求。

- 演示账号 `admin / 123456`（在 `app-config.ts` 的 `mock.username/password` 修改）。
- 默认 `mock.presetLoggedIn=false`：打开即见登录页，未登录无法进入业务页（路由守卫统一拦截）；改为 `true` 可跳过登录页直接进工作台。
- 数据放在 sessionStorage（前缀 `adt-mock:`）：刷新保留已读消息与 CRUD 结果，关闭标签页恢复种子数据；`mock.latency` 控制模拟延迟（默认 120ms）。
- 已覆盖：`POST /login`、`POST /logout`、`GET/PUT {auth.profilePath}`、`GET {auth.permissionsPath|appsPath}`、`GET /api/dicts/options[/batch]`、`GET/POST /api/messages/**`、`/api/admin/message-templates/** CRUD + preview`、`GET /api/admin/messages`、`POST /api/admin/messages/send`、`/api/examples` CRUD、`/api/system/{users,roles,dicts}` CRUD、`/api/form/submit`、`/api/settings` 读写、`/api/dashboard/console/{stats,order-source,user-analysis,latest-orders,consumption-rank}`、`/api/auth/{sms-code,login-by-phone,social-login}`、`/api/auth/applications[/:clientId]`、`/api/auth/devices[/:id]`、`/api/user/notify-prefs`、`/report-error`。
- 新增 mock 接口：在 `src/mock/index.ts` 的 `routes` 数组加一条 `{ method, pattern, handler }`，再在 `src/api/**` 里封装调用。未注册端点返回 404 并在控制台打印 `[mock] 未注册的接口`，便于发现漏接。
- 关闭：`.env.*` 设 `VITE_USE_MOCK=false`，adapter 不安装，全部请求走真实后端。

## 认证协议

关闭 Mock 后，模板使用 **Spring Security 会话制**：

- 登录走浏览器原生表单 `POST {auth.loginPath}`，成功后后端 302；
- 写请求自动带 `X-XSRF-TOKEN`（读 `XSRF-TOKEN` cookie）；
- 用户信息来自 `{auth.profilePath}`，权限点来自 `{auth.permissionsPath}`；
- 上述端点全部集中在 `app-config.ts` 的 `auth` 段。

Mock 模式下 `login` 改用 axios（由 adapter 写入演示会话），其余端点语义一致。

改用 JWT 时需调整四处：`src/api/interceptor.ts`（注入 `Authorization`、401 refresh 队列）、`src/store/modules/user/index.ts`（`login` 改为 axios + 写 token）、`src/router/guard/userLoginInfo.ts`（判断 token）、`config/vite.config.dev.ts`（删除 CSRF 播种插件）。

## 目录约定

```
src/
  api/          # 请求拦截器与端点封装（端点统一来自 app-config）
  components/   # 通用组件（菜单 / 顶栏 / 页签 / 主题设置 / 消息 / 字典下拉 / 图表）
  composables/  # 通用组合式函数
  config/       # 应用 / 主题 / 设置 / 路由动画 / 单点配置
  directive/    # v-permission
  hooks/        # 权限、用户、请求、loading、i18n、响应式、字典
  layout/       # default-layout（外壳） / page-layout（缓存与动画）
  locale/       # i18n 入口与词条
  mock/         # 内置 mock 服务（端点路由表 + 种子数据/会话持久化）
  router/       # 守卫 + routes/modules 自动聚合
  store/        # app / user / tab-bar / loading
  utils/        # 通用工具
  views/        # 登录 / 主控台 / 系统管理 / 表单 / 结果 / 异常 / 设置 / 示例
```

## 注意事项

- Arco `<a-table>` 的列必须写在 `<template #columns>` 内，否则表格整块不渲染。
- 路由页组件必须保持单元素根；注释写在 `<template>` 内首行会制造 Fragment，导致路由白屏。
- 模板 LOGO 以「后台布局」为原型：蓝色底 = 系统外壳，白色条块 = 侧栏/顶栏/内容区，青色块 = 可替换的业务模块；主色 `#165DFF`、点缀 `#14C9C9`。
- ★ SVG 被 `vite-svg-loader` 默认编译成 Vue 组件，`<img src>` 必须写 `@/assets/logo.svg?url` 才是图片地址；漏写 `?url` 时 src 会变成 `[object Object]`、页面裂图（三处引用已修正）。
- 修改 `uaa_api_permission` 一类后端权限注册后，前端请求可能被 403 fail-closed —— 这是后端契约，不是模板问题。
- 构建统一用 `pnpm build`；`NODE_OPTIONS` 若被 shim 占用需清空后再构建。
