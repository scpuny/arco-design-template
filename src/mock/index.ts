/**
 * 内置 Mock 服务 —— axios adapter 层实现，模板默认开启。
 *
 * 为什么放在 adapter 层：请求/响应拦截器、CSRF、错误提示等真实链路全部保留，
 * 只有「真正发网络请求」这一步被替换。接后端时设 VITE_USE_MOCK=false 即彻底失效，
 * 业务代码里的 API 调用一行都不用改。
 *
 * 新增 mock 接口：在下面的 routes 数组里加一条 { method, pattern, handler }。
 */
import axios from 'axios';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  MessageCategoryStat,
  MessageItem,
  MessagePage,
  MsgTemplateRendered,
  MsgTemplateRow,
} from '@/api/message';
import { appConfig } from '@/config/app-config';
import {
  clearMockSession,
  demoUser,
  getConsumptionRank,
  getConsoleStats,
  getWorkplace,
  getExamples,
  getLatestOrders,
  getMessages,
  getOrderSource,
  getSession,
  getTemplates,
  getUserAnalysis,
  getUsers,
  getRoles,
  getDictRows,
  getSettings,
  getOAuthApps,
  getLoginDevices,
  getNotifyPrefs,
  getMonitor,
  getLogs,
  getMenus,
  setMenus,
  setUsers,
  setRoles,
  setDictRows,
  setSettings,
  setOAuthApps,
  setLoginDevices,
  setNotifyPrefs,
  setExamples,
  setMessages,
  setSession,
  setTemplates,
  type DemoUser,
  type ExampleRow,
  type SystemUser,
  type SystemRole,
  type DictRow,
  type SystemSettings,
  type MenuNode,
} from './dataset';

export function isMockEnabled(): boolean {
  return appConfig.mock.enabled;
}

interface MockContext {
  path: string;
  query: URLSearchParams;
  body: Record<string, any>;
  config: AxiosRequestConfig;
}

type MockHandler = (ctx: MockContext) => unknown;

interface MockRoute {
  method: string;
  pattern: string | RegExp;
  handler: MockHandler;
}

class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly payload: unknown
  ) {
    super(`mock http ${status}`);
  }
}

function fail(status: number, message: string): never {
  throw new MockHttpError(status, { message });
}

function parseBody(config: AxiosRequestConfig): Record<string, any> {
  const data = config.data;
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, any>;
    } catch {
      return {};
    }
  }
  if (data instanceof URLSearchParams) {
    const form: Record<string, any> = {};
    data.forEach((value, key) => {
      form[key] = value;
    });
    return form;
  }
  return data as Record<string, any>;
}

function resolvePath(config: AxiosRequestConfig): {
  path: string;
  query: URLSearchParams;
} {
  const parsed = new URL(config.url || '/', 'http://mock.local');
  // baseURL 可能是完整地址，这里只取 pathname 做端点匹配
  return { path: parsed.pathname, query: parsed.searchParams };
}

function match(pattern: string | RegExp, path: string): boolean {
  return typeof pattern === 'string' ? pattern === path : pattern.test(path);
}

function pageResult<T>(all: T[], query: URLSearchParams) {
  const page = Math.max(0, Number(query.get('page') ?? 0) || 0);
  const size = Math.max(1, Number(query.get('size') ?? 20) || 20);
  return {
    content: all.slice(page * size, (page + 1) * size),
    totalElements: all.length,
    totalPages: Math.ceil(all.length / size),
    number: page,
    size,
  };
}

function render(template: string, params: Record<string, unknown>): string {
  return template.replace(/\$\{([^}]+)\}/g, (_all, key: string) =>
    params[key] === undefined ? '' : String(params[key])
  );
}

/** 通用列表过滤：keyword 在指定字段上模糊匹配，再分页。 */
function listResult<T extends Record<string, any>>(
  all: T[],
  query: URLSearchParams,
  searchFields: (keyof T)[]
) {
  const keyword = (query.get('keyword') || '').trim().toLowerCase();
  let list = all;
  if (keyword) {
    list = all.filter((row) =>
      searchFields.some((field) =>
        String(row[field] ?? '').toLowerCase().includes(keyword)
      )
    );
  }
  return pageResult(list, query);
}

const auth = appConfig.auth;

const routes: MockRoute[] = [
  // ---------------- 认证 / 用户 ----------------
  {
    method: 'post',
    pattern: auth.loginPath,
    handler: ({ body }) => {
      if (
        body.username !== appConfig.mock.username ||
        body.password !== appConfig.mock.password
      ) {
        fail(
          400,
          `用户名或密码错误（演示账号：${appConfig.mock.username} / ${appConfig.mock.password}）`
        );
      }
      const user = demoUser();
      setSession(user);
      return { ...user };
    },
  },
  {
    method: 'post',
    pattern: auth.logoutPath,
    handler: () => {
      clearMockSession();
      return { success: true };
    },
  },
  {
    method: 'post',
    pattern: '/api/auth/sms-code',
    handler: ({ body }) => {
      if (!/^1\d{10}$/.test(String(body.phone ?? ''))) fail(400, '请输入正确的手机号');
      return { code: '123456', message: '验证码已发送（演示验证码：123456）' };
    },
  },
  {
    method: 'post',
    pattern: '/api/auth/login-by-phone',
    handler: ({ body }) => {
      if (!/^1\d{10}$/.test(String(body.phone ?? ''))) fail(400, '请输入正确的手机号');
      if (String(body.code ?? '') !== '123456') fail(400, '验证码错误（演示验证码：123456）');
      const user = demoUser();
      setSession(user);
      return { ...user };
    },
  },
  {
    method: 'post',
    pattern: '/api/auth/social-login',
    handler: ({ body }) => {
      if (!['wechat', 'qq', 'weibo'].includes(String(body.provider))) fail(400, '不支持的登录方式');
      const user = demoUser();
      setSession(user);
      return { ...user };
    },
  },
  {
    method: 'get',
    pattern: auth.profilePath,
    // 未登录返回空对象而不是 401：避免引导页会话探测触发全局「登录已过期」弹窗
    handler: () => getSession() ?? {},
  },
  {
    method: 'put',
    pattern: auth.profilePath,
    handler: ({ body }) => {
      const user = getSession();
      if (!user) fail(401, '未登录');
      const next = { ...user, ...body } as DemoUser;
      setSession(next);
      return next;
    },
  },
  {
    method: 'post',
    pattern: `${auth.profilePath}/change-password`,
    handler: ({ body }) => {
      if (body.oldPassword !== appConfig.mock.password) {
        fail(400, '原密码不正确');
      }
      return { success: true };
    },
  },
  {
    method: 'get',
    pattern: auth.permissionsPath,
    handler: () => ({
      permissions: ['*'],
      roles: ['ADMIN'],
      roleNames: ['超级管理员'],
    }),
  },
  {
    method: 'get',
    pattern: auth.appsPath,
    handler: () => [
      {
        key: appConfig.defaultAppKey,
        name: '工作台',
        icon: 'icon-apps',
        sort: 1,
      },
    ],
  },

  // ---------------- 个人中心：OAuth 授权 / 登录设备 / 通知偏好 ----------------
  {
    method: 'get',
    pattern: '/api/auth/applications',
    handler: () => getOAuthApps(),
  },
  {
    method: 'delete',
    pattern: /^\/api\/auth\/applications\/([^/]+)$/,
    handler: ({ path }) => {
      const clientId = decodeURIComponent(path.split('/').pop() || '');
      setOAuthApps(getOAuthApps().filter((a) => a.clientId !== clientId));
      return { success: true };
    },
  },
  {
    method: 'get',
    pattern: '/api/auth/devices',
    handler: () => getLoginDevices(),
  },
  {
    method: 'delete',
    pattern: /^\/api\/auth\/devices\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.split('/').pop());
      const devices = getLoginDevices();
      const target = devices.find((d) => d.id === id);
      if (!target) fail(404, '设备不存在');
      // 下线当前设备后应连会话一起失效，与真实后端口径一致
      if (target.current) clearMockSession();
      setLoginDevices(devices.filter((d) => d.id !== id));
      return { success: true };
    },
  },
  {
    method: 'delete',
    pattern: '/api/auth/devices',
    handler: () => {
      clearMockSession();
      setLoginDevices([]);
      return { success: true };
    },
  },
  {
    method: 'get',
    pattern: '/api/user/notify-prefs',
    handler: () => getNotifyPrefs(),
  },
  {
    method: 'put',
    pattern: '/api/user/notify-prefs',
    handler: ({ body }) => {
      const next = { ...getNotifyPrefs(), [String(body.key)]: !!body.enabled };
      setNotifyPrefs(next);
      return next;
    },
  },

  // ---------------- 字典 ----------------
  {
    method: 'get',
    pattern: '/api/dicts/options',
    handler: ({ query }) => DICTS[query.get('code') || ''] ?? [],
  },
  {
    method: 'get',
    pattern: '/api/dicts/options/batch',
    handler: ({ query }) => {
      const result: Record<string, unknown[]> = {};
      query.getAll('code').forEach((code) => {
        result[code] = DICTS[code] ?? [];
      });
      return result;
    },
  },

  // ---------------- 站内消息（PC 消费） ----------------
  {
    method: 'get',
    pattern: '/api/messages',
    handler: ({ query }): MessagePage => {
      let list = getMessages();
      const channel = query.get('channel');
      if (channel) list = list.filter((m) => m.channelCode === channel);
      const category = query.get('category');
      if (category && category !== 'all') {
        list = list.filter((m) => m.category === category);
      }
      const read = query.get('read');
      if (read !== null) {
        list = list.filter((m) => m.read === (read === 'true'));
      }
      return pageResult(list, query);
    },
  },
  {
    method: 'get',
    pattern: '/api/messages/unread-count',
    handler: () => ({
      count: getMessages().filter((m) => !m.read).length,
    }),
  },
  {
    method: 'get',
    pattern: '/api/messages/categories',
    handler: (): MessageCategoryStat[] => {
      const stats = new Map<string, MessageCategoryStat>();
      getMessages().forEach((m) => {
        const stat = stats.get(m.category) ?? {
          category: m.category,
          total: 0,
          unread: 0,
        };
        stat.total += 1;
        if (!m.read) stat.unread += 1;
        stats.set(m.category, stat);
      });
      return [...stats.values()];
    },
  },
  {
    method: 'post',
    pattern: '/api/messages/read',
    handler: ({ body }) => {
      const ids = new Set<number>((body.ids ?? []) as number[]);
      const list = getMessages();
      let count = 0;
      list.forEach((m) => {
        if (ids.has(m.id) && !m.read) {
          m.read = true;
          m.readAt = new Date().toISOString();
          count += 1;
        }
      });
      setMessages(list);
      return { count };
    },
  },
  {
    method: 'post',
    pattern: '/api/messages/read-all',
    handler: () => {
      const list = getMessages();
      let count = 0;
      list.forEach((m) => {
        if (!m.read) {
          m.read = true;
          m.readAt = new Date().toISOString();
          count += 1;
        }
      });
      setMessages(list);
      return { count };
    },
  },

  // ---------------- 消息管理端 ----------------
  {
    method: 'post',
    pattern: /^\/api\/admin\/message-templates\/(\d+)\/preview$/,
    handler: ({ path, body }): MsgTemplateRendered => {
      const id = Number(path.match(/(\d+)\/preview/)?.[1]);
      const template = getTemplates().find((t) => t.id === id);
      if (!template) fail(404, '模板不存在');
      return {
        title: render(template.titleTemplate, body),
        content: render(template.contentTemplate, body),
      };
    },
  },
  {
    method: 'get',
    pattern: /^\/api\/admin\/message-templates\/(\d+)$/,
    handler: ({ path }): MsgTemplateRow => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const template = getTemplates().find((t) => t.id === id);
      if (!template) fail(404, '模板不存在');
      return template;
    },
  },
  {
    method: 'get',
    pattern: '/api/admin/message-templates',
    handler: ({ query }) => {
      const appKey = query.get('appKey');
      const list = getTemplates();
      return appKey ? list.filter((t) => t.appKey === appKey) : list;
    },
  },
  {
    method: 'post',
    pattern: '/api/admin/message-templates',
    handler: ({ body }): MsgTemplateRow => {
      const list = getTemplates();
      const now = new Date().toISOString();
      const row: MsgTemplateRow = {
        id: Math.max(0, ...list.map((t) => t.id)) + 1,
        code: String(body.code ?? `DEMO_${Date.now()}`),
        appKey: String(body.appKey ?? appConfig.defaultAppKey),
        name: String(body.name ?? '未命名模板'),
        category: String(body.category ?? 'system'),
        titleTemplate: String(body.titleTemplate ?? ''),
        contentTemplate: String(body.contentTemplate ?? ''),
        description: body.description ?? null,
        enabled: body.enabled !== false,
        createdAt: now,
        updatedAt: now,
      };
      setTemplates([row, ...list]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/admin\/message-templates\/(\d+)$/,
    handler: ({ path, body }): MsgTemplateRow => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getTemplates();
      const index = list.findIndex((t) => t.id === id);
      if (index < 0) fail(404, '模板不存在');
      list[index] = {
        ...list[index],
        ...body,
        id,
        updatedAt: new Date().toISOString(),
      };
      setTemplates(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/admin\/message-templates\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      setTemplates(getTemplates().filter((t) => t.id !== id));
      return { id };
    },
  },
  {
    method: 'get',
    pattern: '/api/admin/messages',
    handler: ({ query }) => {
      let list: MessageItem[] = getMessages();
      const appKey = query.get('appKey');
      const category = query.get('category');
      if (category) list = list.filter((m) => m.category === category);
      // appKey 在种子数据里统一归属当前应用
      if (appKey && appKey !== appConfig.defaultAppKey) list = [];
      return pageResult(list, query);
    },
  },
  {
    method: 'post',
    pattern: '/api/admin/messages/send',
    handler: ({ body }) => {
      const list = getMessages();
      const now = new Date().toISOString();
      const item: MessageItem = {
        id: Math.max(0, ...list.map((m) => m.id)) + 1,
        messageId: Date.now(),
        channelCode: String(body.channels?.[0] ?? 'IN_APP'),
        category: String(body.category ?? 'system'),
        title: String(body.title ?? '系统通知'),
        content: String(body.content ?? ''),
        sender: body.sender ?? '系统',
        priority: String(body.priority ?? 'NORMAL'),
        bizId: body.bizId ?? null,
        link: body.link ?? null,
        status: 'DELIVERED',
        read: false,
        createdAt: now,
        readAt: null,
      };
      setMessages([item, ...list]);
      return { message: '发送成功' };
    },
  },

  // ---------------- 主控台 / 仪表盘（全部数据来自 mock） ----------------
  {
    method: 'get',
    pattern: '/api/dashboard/console/stats',
    handler: () => getConsoleStats(),
  },
  {
    method: 'get',
    pattern: '/api/dashboard/console/order-source',
    handler: () => getOrderSource(),
  },
  {
    method: 'get',
    pattern: '/api/dashboard/console/user-analysis',
    handler: () => getUserAnalysis(),
  },
  {
    method: 'get',
    pattern: '/api/dashboard/console/latest-orders',
    handler: () => getLatestOrders(),
  },
  {
    method: 'get',
    pattern: '/api/dashboard/console/consumption-rank',
    handler: () => getConsumptionRank(),
  },
  {
    method: 'get',
    pattern: '/api/dashboard/workplace',
    handler: () => getWorkplace(),
  },

  // ---------------- 监控中心（只读，数值带实时抖动） ----------------
  {
    method: 'get',
    pattern: '/api/monitor/server',
    handler: () => getMonitor(),
  },

  // ---------------- 示例 CRUD（演示接口如何接入 mock） ----------------
  {
    method: 'get',
    pattern: '/api/examples',
    handler: () => getExamples(),
  },
  {
    method: 'post',
    pattern: '/api/examples',
    handler: ({ body }): ExampleRow => {
      const list = getExamples();
      const row: ExampleRow = {
        id: Date.now(),
        name: String(body.name ?? ''),
        code: String(body.code ?? ''),
        status: body.status === '停用' ? '停用' : '启用',
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      };
      setExamples([row, ...list]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/examples\/(\d+)$/,
    handler: ({ path, body }): ExampleRow => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getExamples();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) fail(404, '记录不存在');
      list[index] = {
        ...list[index],
        ...body,
        id,
        updatedAt: new Date().toLocaleString('zh-CN', { hour12: false }),
      } as ExampleRow;
      setExamples(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/examples\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      setExamples(getExamples().filter((r) => r.id !== id));
      return { id };
    },
  },

  // ---------------- 系统管理：用户 / 角色 / 字典 ----------------
  {
    method: 'get',
    pattern: '/api/system/users',
    handler: ({ query }) => listResult(getUsers(), query, ['username', 'name', 'email', 'role']),
  },
  {
    method: 'post',
    pattern: '/api/system/users',
    handler: ({ body }): SystemUser => {
      const list = getUsers();
      const row: SystemUser = {
        id: Date.now(),
        username: String(body.username ?? ''),
        name: String(body.name ?? ''),
        email: String(body.email ?? ''),
        phone: String(body.phone ?? ''),
        status: body.status === '停用' ? '停用' : '启用',
        role: String(body.role ?? '普通用户'),
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setUsers([row, ...list]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/system\/users\/(\d+)$/,
    handler: ({ path, body }): SystemUser => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getUsers();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) fail(404, '用户不存在');
      list[index] = { ...list[index], ...body, id };
      setUsers(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/system\/users\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      setUsers(getUsers().filter((r) => r.id !== id));
      return { id };
    },
  },
  {
    method: 'get',
    pattern: '/api/system/roles',
    handler: ({ query }) => listResult(getRoles(), query, ['name', 'code', 'description']),
  },
  {
    method: 'post',
    pattern: '/api/system/roles',
    handler: ({ body }): SystemRole => {
      const list = getRoles();
      const row: SystemRole = {
        id: Date.now(),
        name: String(body.name ?? ''),
        code: String(body.code ?? ''),
        description: String(body.description ?? ''),
        status: body.status === '停用' ? '停用' : '启用',
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setRoles([row, ...list]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/system\/roles\/(\d+)$/,
    handler: ({ path, body }): SystemRole => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getRoles();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) fail(404, '角色不存在');
      list[index] = { ...list[index], ...body, id, updatedAt: new Date().toISOString().slice(0, 10) };
      setRoles(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/system\/roles\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      setRoles(getRoles().filter((r) => r.id !== id));
      return { id };
    },
  },
  {
    method: 'get',
    pattern: '/api/system/dicts',
    handler: ({ query }) => listResult(getDictRows(), query, ['code', 'name', 'itemCode', 'itemLabel']),
  },
  {
    method: 'post',
    pattern: '/api/system/dicts',
    handler: ({ body }): DictRow => {
      const list = getDictRows();
      const row: DictRow = {
        id: Date.now(),
        code: String(body.code ?? ''),
        name: String(body.name ?? ''),
        itemCode: String(body.itemCode ?? ''),
        itemLabel: String(body.itemLabel ?? ''),
        sort: Number(body.sort ?? 1),
        enabled: body.enabled !== false,
      };
      setDictRows([row, ...list]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/system\/dicts\/(\d+)$/,
    handler: ({ path, body }): DictRow => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getDictRows();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) fail(404, '字典项不存在');
      list[index] = { ...list[index], ...body, id };
      setDictRows(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/system\/dicts\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      setDictRows(getDictRows().filter((r) => r.id !== id));
      return { id };
    },
  },

  // ---------------- 操作日志（筛选 + 分页） ----------------
  {
    method: 'get',
    pattern: '/api/system/logs',
    handler: ({ query }) => {
      let list = getLogs();
      const module = query.get('module');
      if (module && module !== 'all') list = list.filter((l) => l.module === module);
      const level = query.get('level');
      if (level && level !== 'all') list = list.filter((l) => l.level === level);
      const status = query.get('status');
      if (status && status !== 'all') list = list.filter((l) => l.status === status);
      const keyword = (query.get('keyword') || '').trim().toLowerCase();
      if (keyword) {
        list = list.filter((l) =>
          [l.operator, l.operation, l.module, l.detail, l.method].some((f) =>
            f.toLowerCase().includes(keyword),
          ),
        );
      }
      return pageResult(list, query);
    },
  },

  // ---------------- 菜单管理（平铺 CRUD，删除时校验子节点） ----------------
  {
    method: 'get',
    pattern: '/api/system/menus',
    handler: () => getMenus(),
  },
  {
    method: 'post',
    pattern: '/api/system/menus',
    handler: ({ body }): MenuNode => {
      const list = getMenus();
      const row: MenuNode = {
        id: Date.now(),
        parentId: Number(body.parentId ?? 0),
        name: String(body.name ?? ''),
        code: String(body.code ?? ''),
        type: (body.type as MenuNode['type']) || 'menu',
        path: String(body.path ?? ''),
        icon: String(body.icon ?? ''),
        sort: Number(body.sort ?? 1),
        status: body.status === '停用' ? '停用' : '启用',
      };
      setMenus([...list, row]);
      return row;
    },
  },
  {
    method: 'put',
    pattern: /^\/api\/system\/menus\/(\d+)$/,
    handler: ({ path, body }): MenuNode => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getMenus();
      const index = list.findIndex((r) => r.id === id);
      if (index < 0) fail(404, '菜单不存在');
      // 不能把父级改成自己
      if (body.parentId !== undefined && body.parentId === id) fail(400, '父级不能是自身');
      list[index] = { ...list[index], ...body, id };
      setMenus(list);
      return list[index];
    },
  },
  {
    method: 'delete',
    pattern: /^\/api\/system\/menus\/(\d+)$/,
    handler: ({ path }) => {
      const id = Number(path.match(/\/(\d+)$/)?.[1]);
      const list = getMenus();
      if (list.some((m) => m.parentId === id)) fail(400, '请先删除子菜单');
      setMenus(list.filter((m) => m.id !== id && m.parentId !== id));
      return { id };
    },
  },

  // ---------------- 表单页 / 结果页 / 设置页 ----------------
  {
    method: 'post',
    pattern: '/api/form/submit',
    handler: ({ body }) => ({
      id: Date.now(),
      receivedAt: new Date().toISOString(),
      ...body,
    }),
  },
  {
    method: 'get',
    pattern: '/api/form/detail',
    handler: () => ({
      basic: [
        { label: '收款人姓名', value: '阿俊' },
        { label: '收款账户', value: 'NaiveUA@min@qq.com' },
        { label: '付款账户', value: 'NaiveUA@min@163.com' },
        { label: '转账金额', value: '¥ 1980.00' },
        { label: '状态', value: '已到账', tone: 'success' as const },
        { label: '付款类型', value: '支付宝' },
      ],
      other: [
        { label: '城市', value: '深圳' },
        { label: '性别', value: '男' },
        { label: '邮箱', value: 'NaiveUA@min@qq.com' },
        { label: '地址', value: '广东省深圳市南山区' },
        { label: '生日', value: '1991-06-04' },
        { label: '认证', value: '已认证', tone: 'success' as const },
      ],
      records: [
        { id: 1, name: 'Ah jung', gender: '男', city: '深圳', birthday: '1993-11-09' },
        { id: 2, name: '西门飞雪', gender: '男', city: '广州', birthday: '1991-09-11' },
        { id: 3, name: '泰坦巨人', gender: '男', city: '北京', birthday: '1990-11-03' },
        { id: 4, name: '猎人', gender: '女', city: '上海', birthday: '1992-11-11' },
      ],
    }),
  },
  {
    method: 'get',
    pattern: '/api/settings',
    handler: (): SystemSettings => getSettings(),
  },
  {
    method: 'put',
    pattern: '/api/settings',
    handler: ({ body }): SystemSettings => {
      const next = { ...getSettings(), ...body };
      setSettings(next);
      return next;
    },
  },

  // ---------------- 其他 ----------------
  {
    method: 'post',
    pattern: '/report-error',
    handler: () => ({ ok: true }),
  },
];

interface DictOption {
  itemCode: string;
  itemLabel: string;
  tagColor: string | null;
  sort: number;
  enabled: boolean;
  builtin: boolean;
}

const DICTS: Record<string, DictOption[]> = {
  'system.status': [
    {
      itemCode: 'ENABLED',
      itemLabel: '启用',
      tagColor: 'green',
      sort: 1,
      enabled: true,
      builtin: true,
    },
    {
      itemCode: 'DISABLED',
      itemLabel: '停用',
      tagColor: null,
      sort: 2,
      enabled: true,
      builtin: true,
    },
  ],
  yes_no: [
    {
      itemCode: 'Y',
      itemLabel: '是',
      tagColor: 'blue',
      sort: 1,
      enabled: true,
      builtin: true,
    },
    {
      itemCode: 'N',
      itemLabel: '否',
      tagColor: 'red',
      sort: 2,
      enabled: true,
      builtin: true,
    },
  ],
};

const mockAdapter: AxiosAdapter = async (config) => {
  const response = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config,
  });
  const reject = (status: number, data: unknown, message: string) =>
    Promise.reject({
      config,
      isAxiosError: true,
      message,
      response: response(data, status),
    });

  const { path, query } = resolvePath(config);
  const method = (config.method || 'get').toLowerCase();
  const route = routes.find((r) => r.method === method && match(r.pattern, path));

  try {
    if (appConfig.mock.latency > 0) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, appConfig.mock.latency);
      });
    }
    if (!route) {
      const message = `[mock] 未注册的接口：${method.toUpperCase()} ${path}`;
      console.warn(message);
      return reject(404, { message }, message);
    }
    return response(route.handler({ path, query, body: parseBody(config), config }));
  } catch (error) {
    if (error instanceof MockHttpError) {
      const message =
        (error.payload as { message?: string } | null)?.message || error.message;
      return reject(error.status, error.payload, message);
    }
    return Promise.reject(error);
  }
};

/** 在 axios 全局默认值上安装 mock adapter（须在业务请求发出前调用）。 */
export function installMockAdapter(): void {
  axios.defaults.adapter = mockAdapter;
}
