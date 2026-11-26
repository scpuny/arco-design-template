import axios from 'axios';

/** 主控台数据契约 —— 全部由 mock 服务提供，接真实后端时保持相同结构即可。 */
export interface ConsoleStat {
  key: string;
  title: string;
  value: string;
  /** 正数为上升、负数为下降 */
  change: number;
  compare: string;
  icon: string;
  color: string;
}

export interface OrderSource {
  districts: string[];
  completed: number[];
  total: number[];
  conversion: number[];
}

export interface UserAnalysis {
  id: number;
  name: string;
  role: string;
  progress: number;
  avatarColor: string;
}

export type PaymentStatus = '已付款' | '未付款' | '已取消';

export interface LatestOrder {
  id: number;
  user: string;
  userColor: string;
  product: string;
  stock: number;
  amount: number;
  imageColor: string;
  status: PaymentStatus;
  tag: '老客户' | '新客户';
  date: string;
}

export interface ConsumptionRank {
  id: number;
  name: string;
  location: string;
  amount: number;
  avatarColor: string;
}

export function getConsoleStats() {
  return axios.get<ConsoleStat[]>('/api/dashboard/console/stats');
}

export function getOrderSource() {
  return axios.get<OrderSource>('/api/dashboard/console/order-source');
}

export function getUserAnalysis() {
  return axios.get<UserAnalysis[]>('/api/dashboard/console/user-analysis');
}

export function getLatestOrders() {
  return axios.get<LatestOrder[]>('/api/dashboard/console/latest-orders');
}

export function getConsumptionRank() {
  return axios.get<ConsumptionRank[]>('/api/dashboard/console/consumption-rank');
}

/** 工作台数据契约 —— 问候 / 项目 / 动态 / 快捷入口，全部由 mock 提供。 */
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

export function getWorkplace() {
  return axios.get<WorkplaceData>('/api/dashboard/workplace');
}
