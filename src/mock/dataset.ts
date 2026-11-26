/**
 * Mock 数据集与会话持久化。
 *
 * 全部数据放在 sessionStorage（按标签页隔离），刷新页面后已读消息、示例 CRUD
 * 等状态不会丢；关闭标签页即恢复初始种子数据，方便演示。
 */
import type { MessageItem, MsgTemplateRow } from '@/api/message';
import { appConfig } from '@/config/app-config';

const PREFIX = 'adt-mock:';

export interface DemoUser {
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  /** 个人中心扩展字段 */
  employeeNo?: string;
  phone?: string;
  mfaEnabled?: boolean;
  passwordChangedAt?: string;
}

export interface ExampleRow {
  id: number;
  name: string;
  code: string;
  status: '启用' | '停用';
  updatedAt: string;
}

function read<T>(key: string, seed: () => T): T {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* 数据损坏或隐私模式：回退种子数据 */
  }
  return seed();
}

function write(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 隐私模式下不可写：保持内存态即可 */
  }
}

const seedUser: DemoUser = {
  username: appConfig.mock.username,
  displayName: '演示管理员',
  email: 'admin@example.com',
  avatar: '',
  role: 'admin',
  department: '产品技术部',
  employeeNo: 'ADT-001',
  phone: '13800138000',
  mfaEnabled: false,
  passwordChangedAt: '2026-11-01T09:00:00.000Z',
};

export function demoUser(): DemoUser {
  return { ...seedUser };
}

export function getSession(): DemoUser | null {
  return read<DemoUser | null>('session', () =>
    appConfig.mock.presetLoggedIn ? { ...seedUser } : null
  );
}

export function setSession(user: DemoUser | null): void {
  write('session', user);
}

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

function seedMessages(): MessageItem[] {
  return [
    {
      id: 1,
      messageId: 1001,
      channelCode: 'IN_APP',
      category: 'approval',
      title: '一条待审批事项',
      content: '示例流程已到达您的待办，点击前往查看处理。',
      sender: '工作流',
      priority: 'HIGH',
      bizId: 'DEMO-001',
      link: '/dashboard/console',
      status: 'DELIVERED',
      read: false,
      createdAt: minutesAgo(6),
      readAt: null,
    },
    {
      id: 2,
      messageId: 1002,
      channelCode: 'IN_APP',
      category: 'system',
      title: '模板已启用 Mock 服务',
      content: '所有接口由本地 mock 提供，关闭方式见 README。',
      sender: '系统',
      priority: 'NORMAL',
      bizId: null,
      link: null,
      status: 'DELIVERED',
      read: false,
      createdAt: minutesAgo(48),
      readAt: null,
    },
    {
      id: 3,
      messageId: 1003,
      channelCode: 'IN_APP',
      category: 'approval',
      title: '示例提醒',
      content: '这是一条用于演示分类页签的未读消息。',
      sender: '演示数据',
      priority: 'NORMAL',
      bizId: null,
      link: '/example/list',
      status: 'DELIVERED',
      read: false,
      createdAt: minutesAgo(190),
      readAt: null,
    },
    {
      id: 4,
      messageId: 1004,
      channelCode: 'IN_APP',
      category: 'system',
      title: '已读消息示例',
      content: '已读消息不在浮层展示，可在消息中心查看。',
      sender: '系统',
      priority: 'LOW',
      bizId: null,
      link: null,
      status: 'READ',
      read: true,
      createdAt: minutesAgo(1500),
      readAt: minutesAgo(1400),
    },
  ];
}

export function getMessages(): MessageItem[] {
  return read<MessageItem[]>('messages', seedMessages);
}

export function setMessages(list: MessageItem[]): void {
  write('messages', list);
}

function seedExamples(): ExampleRow[] {
  const now = new Date().toLocaleString('zh-CN', { hour12: false });
  return [
    { id: 1, name: '示例条目 A', code: 'DEMO-A', status: '启用', updatedAt: now },
    { id: 2, name: '示例条目 B', code: 'DEMO-B', status: '停用', updatedAt: now },
  ];
}

export function getExamples(): ExampleRow[] {
  return read<ExampleRow[]>('examples', seedExamples);
}

export function setExamples(list: ExampleRow[]): void {
  write('examples', list);
}

function seedTemplates(): MsgTemplateRow[] {
  const now = new Date().toISOString();
  return [
    {
      id: 1,
      code: 'DEMO_APPROVAL',
      appKey: appConfig.defaultAppKey,
      name: '审批提醒',
      category: 'approval',
      titleTemplate: '待审批：${title}',
      contentTemplate: '您有一条待审批事项：${title}，请及时处理。',
      description: '流程审批节点的示例模板',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      code: 'DEMO_SYSTEM',
      appKey: appConfig.defaultAppKey,
      name: '系统通知',
      category: 'system',
      titleTemplate: '系统通知',
      contentTemplate: '${content}',
      description: '通用系统通知示例',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getTemplates(): MsgTemplateRow[] {
  return read<MsgTemplateRow[]>('templates', seedTemplates);
}

export function setTemplates(list: MsgTemplateRow[]): void {
  write('templates', list);
}

// ---------------- 主控台（Dashboard Console）种子数据 ----------------
// 头像用色块+首字，避免依赖外网图片；接真实后端时替换为头像 URL 即可。

const CONSOLE_STATS = [
  {
    key: 'registered',
    title: '本月注册人数',
    value: '62420',
    change: 51,
    compare: '已超过上周',
    icon: 'icon-user-group',
    color: '#00b42a',
  },
  {
    key: 'orders',
    title: '本月订单总数',
    value: '37370',
    change: -12,
    compare: '已少于上周',
    icon: 'icon-file',
    color: '#165dff',
  },
  {
    key: 'payment',
    title: '本周支付金额',
    value: '￥64,218',
    change: -8,
    compare: '已少于上周',
    icon: 'icon-wechatpay',
    color: '#ff7d00',
  },
  {
    key: 'sales',
    title: '本月销售总额',
    value: '￥35,240',
    change: 61,
    compare: '已超过上周',
    icon: 'icon-bar-chart',
    color: '#722ed1',
  },
];

const ORDER_SOURCE = {
  districts: ['西城区', '顺义区', '朝阳区', '大兴区', '海淀区', '昌平区', '西城区', '东城区', '丰台区'],
  completed: [88, 46, 93, 63, 46, 82, 24, 53, 96],
  total: [34, 66, 28, 48, 66, 40, 83, 77, 20],
  conversion: [35, 52, 40, 58, 63, 68, 25, 70, 83],
};

const USER_ANALYSIS = [
  { id: 1, name: '小猪妹', role: '高级成本会计师', progress: 35, avatarColor: '#f53f3f' },
  { id: 2, name: '妖姬妹', role: '药剂师', progress: 45, avatarColor: '#722ed1' },
  { id: 3, name: '爱斯', role: '高级成本会计师', progress: 55, avatarColor: '#ff7d00' },
  { id: 4, name: '罗威娜', role: '药剂师', progress: 65, avatarColor: '#00b42a' },
  { id: 5, name: '小娜', role: '药剂师', progress: 65, avatarColor: '#165dff' },
];

const LATEST_ORDERS = [
  { id: 1, user: 'Arco Admin', userColor: '#f53f3f', product: '标准版授权', stock: 86, amount: 298, imageColor: '#f53f3f', status: '已付款' as const, tag: '老客户' as const, date: '2022-09-19' },
  { id: 2, user: 'Arco Admin', userColor: '#165dff', product: '专业版授权', stock: 62, amount: 298, imageColor: '#165dff', status: '已付款' as const, tag: '新客户' as const, date: '2022-09-19' },
  { id: 3, user: 'Arco Admin', userColor: '#ff7d00', product: '企业版授权', stock: 41, amount: 298, imageColor: '#ff7d00', status: '未付款' as const, tag: '老客户' as const, date: '2022-09-19' },
  { id: 4, user: 'Arco Admin', userColor: '#722ed1', product: '旗舰版授权', stock: 28, amount: 298, imageColor: '#722ed1', status: '已取消' as const, tag: '新客户' as const, date: '2022-09-19' },
  { id: 5, user: 'Arco Admin', userColor: '#00b42a', product: '增值服务包', stock: 15, amount: 298, imageColor: '#00b42a', status: '已取消' as const, tag: '老客户' as const, date: '2022-09-19' },
];

const CONSUMPTION_RANK = [
  { id: 1, name: 'Arco Admin', location: '北京市/东城区', amount: 69800, avatarColor: '#f53f3f' },
  { id: 2, name: 'Arco Admin', location: '上海市/黄浦区', amount: 59800, avatarColor: '#722ed1' },
  { id: 3, name: 'Arco Admin', location: '浙江省/杭州市', amount: 49800, avatarColor: '#ff7d00' },
  { id: 4, name: 'Arco Admin', location: '江西省/萍乡市', amount: 39800, avatarColor: '#00b42a' },
  { id: 5, name: 'Arco Admin', location: '广东省/深圳市', amount: 29800, avatarColor: '#165dff' },
  { id: 6, name: 'Arco Admin', location: '湖南省/衡阳市', amount: 19800, avatarColor: '#14c9c9' },
];

export function getConsoleStats() {
  return CONSOLE_STATS.map((item) => ({ ...item }));
}

export function getOrderSource() {
  return JSON.parse(JSON.stringify(ORDER_SOURCE));
}

export function getUserAnalysis() {
  return USER_ANALYSIS.map((item) => ({ ...item }));
}

export function getLatestOrders() {
  return LATEST_ORDERS.map((item) => ({ ...item }));
}

export function getConsumptionRank() {
  return CONSUMPTION_RANK.map((item) => ({ ...item }));
}

// ---------------- 工作台（Workplace）种子数据 ----------------
// 参考 Naive Admin Workplace：问候区 / 项目卡 / 最近动态 / 快捷入口，全部 mock。

export interface WorkplaceSummary {
  projects: number;
  todos: number;
  messages: number;
}

export interface WorkplaceWeather {
  text: string;
  temperature: string;
  icon: string;
  city: string;
}

export interface WorkplaceProject {
  id: number;
  name: string;
  desc: string;
  icon: string;
  color: string;
  status: '进行中' | '待启动' | '已完成';
  progress: number;
  createdAt: string;
  creator: string;
}

export interface WorkplaceActivity {
  id: number;
  user: string;
  userColor: string;
  action: string;
  target: string;
  time: string;
}

export interface WorkplaceShortcut {
  id: number;
  name: string;
  icon: string;
  color: string;
  path: string;
}

export interface WorkplaceData {
  summary: WorkplaceSummary;
  weather: WorkplaceWeather;
  projects: WorkplaceProject[];
  activities: WorkplaceActivity[];
  shortcuts: WorkplaceShortcut[];
}

const WORKPLACE: WorkplaceData = {
  summary: { projects: 4, todos: 8, messages: 3 },
  weather: { text: '晴', temperature: '26°C', icon: 'icon-sun', city: '北京市' },
  projects: [
    {
      id: 1,
      name: 'Arco Design 模板',
      desc: '开箱即用的 Vue3 + Arco 中后台骨架',
      icon: 'icon-apps',
      color: '#165dff',
      status: '进行中',
      progress: 65,
      createdAt: '2026-11-01',
      creator: '演示管理员',
    },
    {
      id: 2,
      name: '数据可视化看板',
      desc: 'ECharts 图表封装与主题联动',
      icon: 'icon-pie-chart',
      color: '#00b42a',
      status: '进行中',
      progress: 40,
      createdAt: '2026-11-05',
      creator: '张伟',
    },
    {
      id: 3,
      name: '权限体系升级',
      desc: 'RBAC + 菜单 / 按钮细粒度控制',
      icon: 'icon-safe',
      color: '#ff7d00',
      status: '待启动',
      progress: 0,
      createdAt: '2026-11-10',
      creator: '李娜',
    },
    {
      id: 4,
      name: '移动端适配',
      desc: '响应式布局与交互优化',
      icon: 'icon-mobile',
      color: '#722ed1',
      status: '已完成',
      progress: 100,
      createdAt: '2026-10-20',
      creator: '王强',
    },
  ],
  activities: [
    { id: 1, user: '演示管理员', userColor: '#165dff', action: '提交了', target: '「Arco Design 模板」的登录页重构', time: '10 分钟前' },
    { id: 2, user: '张伟', userColor: '#00b42a', action: '完成了', target: '「数据可视化看板」的阶段评审', time: '1 小时前' },
    { id: 3, user: '李娜', userColor: '#ff7d00', action: '创建了', target: '「权限体系升级」项目', time: '昨天 18:32' },
    { id: 4, user: '王强', userColor: '#722ed1', action: '归档了', target: '「移动端适配」项目', time: '2 天前' },
    { id: 5, user: '陈静', userColor: '#14c9c9', action: '发布了', target: '站内系统通知模板', time: '3 天前' },
  ],
  shortcuts: [
    { id: 1, name: '设置页面', icon: 'icon-settings', color: '#165dff', path: '/settings' },
    { id: 2, name: '基础列表', icon: 'icon-list', color: '#00b42a', path: '/example/list' },
    { id: 3, name: '用户管理', icon: 'icon-user', color: '#ff7d00', path: '/system/user' },
    { id: 4, name: '基础表单', icon: 'icon-edit', color: '#722ed1', path: '/form/basic' },
    { id: 5, name: '系统字典', icon: 'icon-book', color: '#14c9c9', path: '/system/dict' },
    { id: 6, name: '消息中心', icon: 'icon-notification', color: '#f53f3f', path: '' },
  ],
};

export function getWorkplace(): WorkplaceData {
  return JSON.parse(JSON.stringify(WORKPLACE));
}

// ---------------- 通用管理页种子数据（用户 / 角色 / 字典） ----------------

export interface SystemUser {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  status: '启用' | '停用';
  role: string;
  createdAt: string;
}

export interface SystemRole {
  id: number;
  name: string;
  code: string;
  description: string;
  status: '启用' | '停用';
  updatedAt: string;
}

export interface DictRow {
  id: number;
  code: string;
  name: string;
  itemCode: string;
  itemLabel: string;
  sort: number;
  enabled: boolean;
}

function seedUsers(): SystemUser[] {
  return [
    { id: 1, username: 'admin', name: '演示管理员', email: 'admin@example.com', phone: '13800138000', status: '启用', role: '超级管理员', createdAt: '2026-01-12' },
    { id: 2, username: 'zhangwei', name: '张伟', email: 'zhangwei@example.com', phone: '13900139001', status: '启用', role: '系统管理员', createdAt: '2026-02-03' },
    { id: 3, username: 'lina', name: '李娜', email: 'lina@example.com', phone: '13900139002', status: '启用', role: '普通用户', createdAt: '2026-02-18' },
    { id: 4, username: 'wangqiang', name: '王强', email: 'wangqiang@example.com', phone: '13900139003', status: '停用', role: '普通用户', createdAt: '2026-03-05' },
    { id: 5, username: 'chenjing', name: '陈静', email: 'chenjing@example.com', phone: '13900139004', status: '启用', role: '审计员', createdAt: '2026-03-22' },
    { id: 6, username: 'zhaolei', name: '赵磊', email: 'zhaolei@example.com', phone: '13900139005', status: '启用', role: '普通用户', createdAt: '2026-04-10' },
  ];
}

function seedRoles(): SystemRole[] {
  return [
    { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', description: '拥有系统全部权限', status: '启用', updatedAt: '2026-01-12' },
    { id: 2, name: '系统管理员', code: 'SYS_ADMIN', description: '系统与用户管理权限', status: '启用', updatedAt: '2026-02-03' },
    { id: 3, name: '审计员', code: 'AUDITOR', description: '只读审计权限', status: '启用', updatedAt: '2026-02-18' },
    { id: 4, name: '普通用户', code: 'USER', description: '基础业务权限', status: '启用', updatedAt: '2026-03-05' },
  ];
}

function seedDicts(): DictRow[] {
  return [
    { id: 1, code: 'system.status', name: '系统状态', itemCode: 'ENABLED', itemLabel: '启用', sort: 1, enabled: true },
    { id: 2, code: 'system.status', name: '系统状态', itemCode: 'DISABLED', itemLabel: '停用', sort: 2, enabled: true },
    { id: 3, code: 'yes_no', name: '是否', itemCode: 'Y', itemLabel: '是', sort: 1, enabled: true },
    { id: 4, code: 'yes_no', name: '是否', itemCode: 'N', itemLabel: '否', sort: 2, enabled: true },
    { id: 5, code: 'user.gender', name: '性别', itemCode: 'M', itemLabel: '男', sort: 1, enabled: true },
    { id: 6, code: 'user.gender', name: '性别', itemCode: 'F', itemLabel: '女', sort: 2, enabled: true },
  ];
}

export const getUsers = () => read<SystemUser[]>('users', seedUsers);
export const setUsers = (list: SystemUser[]) => write('users', list);
export const getRoles = () => read<SystemRole[]>('roles', seedRoles);
export const setRoles = (list: SystemRole[]) => write('roles', list);
export const getDictRows = () => read<DictRow[]>('dict-rows', seedDicts);
export const setDictRows = (list: DictRow[]) => write('dict-rows', list);

export interface SystemSettings {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  pageSize: number;
  enableRegister: boolean;
  enableNotify: boolean;
  description: string;
}

const seedSettings: SystemSettings = {
  siteName: 'Arco Design Template',
  siteUrl: 'https://example.com',
  contactEmail: 'admin@example.com',
  pageSize: 20,
  enableRegister: true,
  enableNotify: true,
  description: '开箱即用的 Vue3 + Arco Design 管理后台模板',
};

export const getSettings = () => read<SystemSettings>('settings', () => ({ ...seedSettings }));
export const setSettings = (value: SystemSettings) => write('settings', value);

/* ---------------- 个人中心 ---------------- */
export interface OAuthAppRow {
  clientId: string;
  clientName: string;
  scopes: string[];
  authorizedAt: string;
}

export interface LoginDeviceRow {
  id: number;
  deviceId: string;
  systemType: 'PC' | 'MOBILE';
  browser?: string;
  os?: string;
  deviceName?: string;
  ip?: string;
  loginAt: string;
  lastAccessAt?: string;
  current: boolean;
}

export interface NotifyPrefs {
  system: boolean;
  email: boolean;
  sms: boolean;
}

const seedOAuthApps: OAuthAppRow[] = [
  { clientId: 'demo-web', clientName: '演示门户', scopes: ['profile', 'message:read'], authorizedAt: '2026-10-18T08:30:00.000Z' },
  { clientId: 'demo-mobile', clientName: '移动端 App', scopes: ['profile', 'offline_access'], authorizedAt: '2026-11-02T12:10:00.000Z' },
];

const seedDevices: LoginDeviceRow[] = [
  {
    id: 1,
    deviceId: 'pc-current',
    systemType: 'PC',
    browser: 'Chrome 130',
    os: 'Linux x86_64',
    deviceName: '当前浏览器',
    ip: '127.0.0.1',
    loginAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    lastAccessAt: new Date().toISOString(),
    current: true,
  },
  {
    id: 2,
    deviceId: 'mobile-1',
    systemType: 'MOBILE',
    browser: 'Android WebView',
    os: 'Android 14',
    deviceName: 'Pixel 8',
    ip: '10.0.2.15',
    loginAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    lastAccessAt: new Date(Date.now() - 40 * 60_000).toISOString(),
    current: false,
  },
  {
    id: 3,
    deviceId: 'pc-office',
    systemType: 'PC',
    browser: 'Edge 130',
    os: 'Windows 11',
    deviceName: '办公室电脑',
    ip: '192.168.1.28',
    loginAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
    lastAccessAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    current: false,
  },
];

const seedNotifyPrefs: NotifyPrefs = { system: true, email: true, sms: false };

export const getOAuthApps = () => read<OAuthAppRow[]>('oauth-apps', () => seedOAuthApps.map((a) => ({ ...a })));
export const setOAuthApps = (list: OAuthAppRow[]) => write('oauth-apps', list);
export const getLoginDevices = () => read<LoginDeviceRow[]>('devices', () => seedDevices.map((d) => ({ ...d })));
export const setLoginDevices = (list: LoginDeviceRow[]) => write('devices', list);
export const getNotifyPrefs = () => read<NotifyPrefs>('notify-prefs', () => ({ ...seedNotifyPrefs }));
export const setNotifyPrefs = (value: NotifyPrefs) => write('notify-prefs', value);

/** 退出登录只清会话；消息与示例数据保留，便于反复演示。 */
export function clearMockSession(): void {
  try {
    sessionStorage.removeItem(PREFIX + 'session');
  } catch {
    /* 忽略 */
  }
}

// ---------------- 监控中心（只读展示，每次取数带轻微抖动模拟实时） ----------------
export interface MonitorCpu {
  usage: number;
  cores: number;
  online: number;
  system: number;
  user: number;
  nice: number;
  idle: number;
}
export interface MonitorMemory {
  total: number;
  used: number;
  free: number;
  usage: number;
}
export interface MonitorSwap {
  total: number;
  used: number;
  free: number;
  usage: number;
}
export interface MonitorDisk {
  name: string;
  mount: string;
  type: string;
  total: number;
  used: number;
  free: number;
  usage: number;
}
export interface MonitorProcess {
  pid: number;
  name: string;
  user: string;
  cpu: number;
  mem: number;
  startedAt: string;
  status: '运行中' | '已停止';
}
export interface MonitorServer {
  host: string;
  ip: string;
  os: string;
  arch: string;
  java: string;
  uptime: string;
  load: [number, number, number];
  cpu: MonitorCpu;
  memory: MonitorMemory;
  swap: MonitorSwap;
  disks: MonitorDisk[];
  processes: MonitorProcess[];
}

/** 取一个 0~1 的小随机数，用来给指标制造「实时波动」感。 */
const jitter = (base: number, span: number) =>
  Math.max(0, Math.min(100, Math.round(base + (Math.random() * 2 - 1) * span)));

export function getMonitor(): MonitorServer {
  const cpuUsage = jitter(42, 18);
  const memUsage = jitter(58, 10);
  return {
    host: 'naive-node-01',
    ip: '192.168.1.12',
    os: 'Ubuntu 22.04 LTS',
    arch: 'amd64',
    java: 'OpenJDK 17.0.9',
    uptime: '28 天 6 小时',
    load: [Number((Math.random() * 1.2 + 0.3).toFixed(2)), 0.8, 0.5],
    cpu: {
      usage: cpuUsage,
      cores: 8,
      online: 8,
      system: Math.round(cpuUsage * 0.35),
      user: Math.round(cpuUsage * 0.6),
      nice: 0,
      idle: 100 - cpuUsage,
    },
    memory: {
      total: 16,
      used: Number((16 * (memUsage / 100)).toFixed(1)),
      free: Number((16 * (1 - memUsage / 100)).toFixed(1)),
      usage: memUsage,
    },
    swap: {
      total: 4,
      used: 0.3,
      free: 3.7,
      usage: 8,
    },
    disks: [
      { name: '系统盘 /', mount: '/', type: 'ext4', total: 50, used: 28.4, free: 21.6, usage: 57 },
      { name: '数据盘 /data', mount: '/data', type: 'ext4', total: 200, used: 132.6, free: 67.4, usage: 66 },
      { name: '日志盘 /logs', mount: '/logs', type: 'xfs', total: 100, used: 91.2, free: 8.8, usage: 91 },
    ],
    processes: [
      { pid: 1024, name: 'java (spring-boot)', user: 'app', cpu: 24, mem: 32, startedAt: '28 天前', status: '运行中' },
      { pid: 2088, name: 'nginx', user: 'root', cpu: 6, mem: 4, startedAt: '28 天前', status: '运行中' },
      { pid: 2089, name: 'postgres', user: 'postgres', cpu: 12, mem: 18, startedAt: '28 天前', status: '运行中' },
      { pid: 3101, name: 'redis-server', user: 'redis', cpu: 2, mem: 6, startedAt: '12 天前', status: '运行中' },
      { pid: 4220, name: 'kafka', user: 'kafka', cpu: 9, mem: 14, startedAt: '12 天前', status: '运行中' },
      { pid: 5600, name: 'node (bff)', user: 'node', cpu: 3, mem: 8, startedAt: '3 天前', status: '运行中' },
    ],
  };
}

// ---------------- 操作日志（sessionStorage 持久化，演示搜索/筛选） ----------------
export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface OperationLog {
  id: number;
  module: string;
  operation: string;
  method: string;
  operator: string;
  ip: string;
  level: LogLevel;
  status: '成功' | '失败';
  cost: number;
  time: string;
  detail: string;
}

const seedLogs: OperationLog[] = [
  { id: 1, module: '系统管理', operation: '登录成功', method: 'POST /api/auth/login', operator: 'admin', ip: '127.0.0.1', level: 'INFO', status: '成功', cost: 42, time: '2026-11-25 09:02:11', detail: '账号 admin 通过账号密码登录，会话有效期 7 天。' },
  { id: 2, module: '用户管理', operation: '新增用户', method: 'POST /api/system/users', operator: 'admin', ip: '10.1.2.18', level: 'INFO', status: '成功', cost: 88, time: '2026-11-25 09:14:33', detail: '创建用户 zhangsan（角色：普通用户）。' },
  { id: 3, module: '权限体系', operation: '分配角色', method: 'PUT /api/system/roles/12', operator: 'admin', ip: '10.1.2.18', level: 'INFO', status: '成功', cost: 61, time: '2026-11-25 09:22:05', detail: '为用户 张三 分配角色「系统管理员」。' },
  { id: 4, module: '订单中心', operation: '提交订单', method: 'POST /api/orders', operator: 'lisi', ip: '10.1.3.7', level: 'WARN', status: '成功', cost: 1520, time: '2026-11-25 10:08:47', detail: '订单金额较大（¥12800），已触发风控复核。' },
  { id: 5, module: '消息中心', operation: '发送通知', method: 'POST /api/messages/read-all', operator: 'lisi', ip: '10.1.3.7', level: 'ERROR', status: '失败', cost: 203, time: '2026-11-25 10:12:19', detail: '批量读取消费：下游队列暂不可用，已入重试队列。' },
  { id: 6, module: '监控中心', operation: '采集指标', method: 'GET /api/monitor/server', operator: 'system', ip: '127.0.0.1', level: 'INFO', status: '成功', cost: 12, time: '2026-11-25 10:30:00', detail: '定时采集 CPU / 内存 / 磁盘指标完成。' },
  { id: 7, module: '用户管理', operation: '停用用户', method: 'PUT /api/system/users/8', operator: 'admin', ip: '10.1.2.18', level: 'WARN', status: '成功', cost: 54, time: '2026-11-25 11:01:52', detail: '用户 wangwu 被停用，已强制下线 1 台在线设备。' },
  { id: 8, module: '登录安全', operation: '异常登录拦截', method: 'POST /api/auth/login', operator: 'unknown', ip: '203.0.113.99', level: 'ERROR', status: '失败', cost: 8, time: '2026-11-25 11:20:34', detail: '连续 5 次密码错误，IP 已临时封禁 15 分钟。' },
];

export function getLogs(): OperationLog[] {
  return read<OperationLog[]>('logs', () => seedLogs.map((l) => ({ ...l })));
}
export function setLogs(list: OperationLog[]): void {
  write('logs', list);
}

// ---------------- 菜单管理（树形 + sessionStorage 持久化） ----------------
export type MenuType = 'directory' | 'menu' | 'button';

export interface MenuNode {
  id: number;
  parentId: number; // 0 表示顶级
  name: string;
  code: string;
  type: MenuType;
  path: string;
  icon: string;
  sort: number;
  status: '启用' | '停用';
}

const seedMenus: MenuNode[] = [
  { id: 1, parentId: 0, name: '仪表盘', code: 'dashboard', type: 'directory', path: '/dashboard', icon: 'icon-dashboard', sort: 1, status: '启用' },
  { id: 2, parentId: 1, name: '主控台', code: 'dashboard.console', type: 'menu', path: '/dashboard/console', icon: 'icon-pie-chart', sort: 1, status: '启用' },
  { id: 3, parentId: 1, name: '工作台', code: 'dashboard.workplace', type: 'menu', path: '/dashboard/workplace', icon: 'icon-apps', sort: 2, status: '启用' },
  { id: 4, parentId: 1, name: '监控中心', code: 'dashboard.monitor', type: 'menu', path: '/dashboard/monitor', icon: 'icon-activity', sort: 3, status: '启用' },

  { id: 10, parentId: 0, name: '系统管理', code: 'system', type: 'directory', path: '/system', icon: 'icon-settings', sort: 2, status: '启用' },
  { id: 11, parentId: 10, name: '用户管理', code: 'system.user', type: 'menu', path: '/system/user', icon: 'icon-user', sort: 1, status: '启用' },
  { id: 12, parentId: 10, name: '角色管理', code: 'system.role', type: 'menu', path: '/system/role', icon: 'icon-clipboard', sort: 2, status: '启用' },
  { id: 13, parentId: 10, name: '字典管理', code: 'system.dict', type: 'menu', path: '/system/dict', icon: 'icon-book', sort: 3, status: '启用' },
  { id: 14, parentId: 10, name: '操作日志', code: 'system.logs', type: 'menu', path: '/system/logs', icon: 'icon-file-text', sort: 4, status: '启用' },
  { id: 15, parentId: 10, name: '菜单管理', code: 'system.menu', type: 'menu', path: '/system/menu', icon: 'icon-menu-app', sort: 5, status: '启用' },
  { id: 16, parentId: 11, name: '用户-新增', code: 'system.user.create', type: 'button', path: '', icon: '', sort: 1, status: '启用' },
  { id: 17, parentId: 11, name: '用户-删除', code: 'system.user.delete', type: 'button', path: '', icon: '', sort: 2, status: '启用' },
];

export function getMenus(): MenuNode[] {
  return read<MenuNode[]>('menus', () => seedMenus.map((m) => ({ ...m })));
}
export function setMenus(list: MenuNode[]): void {
  write('menus', list);
}



