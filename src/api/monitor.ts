import axios from 'axios';

/**
 * 监控中心接口 —— 全部由 mock 提供（数值带实时抖动）。
 * 接真实后端时实现同名端点即可，页面零改动。
 */
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

export function getMonitor() {
  return axios.get<MonitorServer>('/api/monitor/server').then((r) => r.data);
}
