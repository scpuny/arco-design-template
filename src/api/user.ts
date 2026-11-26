import axios from 'axios';
import type { RouteRecordNormalized } from 'vue-router';
import { appConfig } from '@/config/app-config';

export interface LoginData {
  username: string;
  password: string;
  /** 仅前端跳转用，不发送给后端 */
  redirect?: string;
}

/**
 * 认证相关 API —— 全部端点来自 config/app-config.ts。
 * 默认协议：浏览器原生表单 POST {loginPath} 建立 cookie 会话；
 * Mock 模式（模板默认）走 loginRequest()，由 src/mock 接管并写入演示会话；
 * 若目标系统使用 JWT，把登录逻辑换成 axios 请求并写入 token 即可。
 */

/** 仅 mock 模式使用：把登录交给 adapter 处理，避免原生表单真的跳转。 */
export function loginRequest(data: Pick<LoginData, 'username' | 'password'>) {
  return axios.post(appConfig.auth.loginPath, data);
}

export function logout() {
  return axios.post(appConfig.auth.logoutPath);
}

/** 手机验证码登录（演示用，mock 返回验证码 123456）。 */
export function sendSmsCode(phone: string) {
  return axios.post('/api/auth/sms-code', { phone });
}

export function loginByPhone(phone: string, code: string) {
  return axios.post('/api/auth/login-by-phone', { phone, code });
}

/** 第三方登录入口（微信 / QQ / 微博），mock 模式直接建立演示会话。 */
export function socialLogin(provider: 'wechat' | 'qq' | 'weibo') {
  return axios.post('/api/auth/social-login', { provider });
}

export function getUserInfo() {
  return axios.get(appConfig.auth.profilePath);
}

export function authPermissions() {
  return axios.get(appConfig.auth.permissionsPath);
}

export function getNavApps() {
  return axios.get(appConfig.auth.appsPath);
}

/** 修改本人资料（按后端实际字段裁剪）。 */
export function updateMyProfile(data: {
  displayName?: string;
  department?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}) {
  return axios.put(appConfig.auth.profilePath, data);
}

/** 修改本人密码（按后端实际字段裁剪）。 */
export function changeMyPassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return axios.post(`${appConfig.auth.profilePath}/change-password`);
}

/** 登录设备（PC 会话 + 移动端令牌同一台账）。 */
export interface LoginDevice {
  id: number;
  deviceId: string;
  systemType: 'PC' | 'MOBILE';
  browser?: string;
  os?: string;
  deviceName?: string;
  ip?: string;
  loginAt: string;
  lastAccessAt?: string;
  /** 是否为发起本次请求的设备 */
  current: boolean;
}

export interface OAuthApplication {
  clientId: string;
  clientName: string;
  scopes: string[];
  authorizedAt: string;
}

/** 个人中心 —— 第三方 OAuth 授权 */
export function myApplications() {
  return axios.get<OAuthApplication[]>('/api/auth/applications');
}
export function revokeApplication(clientId: string) {
  return axios.delete(`/api/auth/applications/${clientId}`);
}

/** 个人中心 —— 登录设备台账 */
export function listLoginDevices() {
  return axios.get<LoginDevice[]>('/api/auth/devices');
}
export function logoutLoginDevice(id: number) {
  return axios.delete(`/api/auth/devices/${id}`);
}
export function logoutAllLoginDevices() {
  return axios.delete('/api/auth/devices');
}

/** 个人中心 —— 通知偏好（mock 持久化，接后端时保持同名端点即可） */
export function getNotifyPrefs() {
  return axios.get<Record<string, boolean>>('/api/user/notify-prefs');
}
export function saveNotifyPref(key: string, enabled: boolean) {
  return axios.put('/api/user/notify-prefs', { key, enabled });
}

/** 模板使用静态路由，无需服务端菜单；保留空实现以兼容 appStore 的调用点。 */
export function getMenuList() {
  return Promise.resolve({ data: [] as unknown as RouteRecordNormalized[] });
}
