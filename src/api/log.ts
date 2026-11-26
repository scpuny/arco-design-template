import axios from 'axios';

/**
 * 操作日志接口 —— 全部由 mock 提供。接真实后端时实现同名端点即可。
 */
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

export interface LogQuery {
  module?: string;
  level?: LogLevel;
  status?: '成功' | '失败';
  keyword?: string;
  page?: number;
  size?: number;
}

export interface LogPage {
  content: OperationLog[];
  totalElements: number;
  number: number;
  size: number;
}

export function getLogs(query: LogQuery = {}) {
  return axios
    .get<LogPage>('/api/system/logs', { params: { size: 100, ...query } })
    .then((r) => r.data);
}
