<template>
  <div class="user-page">
    <div class="uc-body">
      <!-- 左侧设置导航：单一「拉通」面板（高 = 右侧内容高），内含用户卡 + 设置菜单 -->
      <aside class="uc-nav">
        <div class="uc-nav__inner">
          <div class="uc-nav__user">
            <div class="uc-avatar">
              <img v-if="avatarUrl" :src="avatarUrl" alt="用户头像" />
              <icon-user v-else />
            </div>
            <div class="uc-user-name">{{ profile?.displayName || profile?.username || '—' }}</div>
            <div class="uc-user-sub">{{ profile?.username || '—' }} · 工号 {{ profile?.employeeNo || '—' }}</div>
            <div class="uc-user-tags">
              <span v-for="r in myRoleNames" :key="r" class="uc-role-tag">{{ r }}</span>
              <span v-if="!myRoleNames.length" class="uc-user-sub">未分配角色</span>
            </div>
            <button type="button" class="uc-avatar-btn" @click="onChangeAvatar">
              <icon-upload />
              <span>更换头像</span>
            </button>
            <input
              ref="avatarInput"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              class="uc-avatar-file"
              @change="onAvatarPicked"
            />
          </div>

          <nav class="uc-nav__menu">
            <div
              v-for="m in navItems"
              :key="m.key"
              class="uc-nav__item"
              :class="{ 'is-active': activeNav === m.key }"
              @click="onNav(m)"
            >
              <icon-edit v-if="m.key === 'profile'" />
              <icon-safe v-else-if="m.key === 'security'" />
              <icon-notification v-else-if="m.key === 'notify'" />
              <icon-desktop v-else-if="m.key === 'devices'" />
              <icon-user-group v-else />
              <span>{{ m.label }}</span>
            </div>
          </nav>
        </div>
      </aside>

      <!-- 右侧分区卡片 -->
      <div class="uc-content">
        <!-- ① 基本资料 -->
        <div ref="cardProfile" id="profile" class="uc-card">
          <div class="uc-card__head">
            <div class="uc-card__title">基本资料</div>
            <a-button size="small" @click="openEditProfile">
              <template #icon><icon-edit /></template>
              编辑
            </a-button>
          </div>
          <div class="uc-grid">
            <div class="uc-field">
              <span class="uc-field__label">姓名</span>
              <a-input :model-value="profile?.displayName || ''" readonly size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">用户名（不可修改）</span>
              <a-input :model-value="profile?.username || ''" disabled size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">工号</span>
              <a-input :model-value="profile?.employeeNo || '—'" readonly size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">所在厂区 / 部门</span>
              <a-input :model-value="profile?.department || '—'" readonly size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">邮箱</span>
              <a-input :model-value="profile?.email || '—'" readonly size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">手机号</span>
              <a-input :model-value="profile?.phone || '—'" readonly size="large" />
            </div>
            <div class="uc-field">
              <span class="uc-field__label">界面主题偏好</span>
              <a-radio-group :model-value="themeMode" type="button" size="small" @change="onThemeChange">
                <a-radio value="dark">深色</a-radio>
                <a-radio value="light">浅色</a-radio>
              </a-radio-group>
            </div>
            <div class="uc-field">
              <span class="uc-field__label">默认落地页</span>
              <a-select :model-value="landingPage" size="large" @change="onLandingChange">
                <a-option value="/dashboard/console">主控台</a-option>
                <a-option value="/system/user">用户管理</a-option>
                <a-option value="/system/role">角色管理</a-option>
                <a-option value="/user">个人中心</a-option>
              </a-select>
            </div>
          </div>
        </div>

        <!-- ② 安全设置 -->
        <div ref="cardSecurity" id="security" class="uc-card">
          <div class="uc-card__head">
            <div class="uc-card__icon"><icon-safe /></div>
            <div class="uc-card__title">安全设置</div>
          </div>
          <div class="uc-subpanel">
            <div class="uc-row">
              <div class="uc-row__left">
                <div class="uc-row__icon t-primary"><icon-lock /></div>
                <div>
                  <div class="uc-row__title">登录密码</div>
                  <div class="uc-row__desc">上次修改：{{ pwdChangedAt }}</div>
                </div>
              </div>
              <a-button size="small" type="primary" @click="openChangePwd">修改密码</a-button>
            </div>
          </div>
          <div class="uc-subpanel">
            <div class="uc-row">
              <div class="uc-row__left">
                <div class="uc-row__icon t-success"><icon-safe /></div>
                <div>
                  <div class="uc-row__title">多因素认证（MFA）</div>
                  <div class="uc-row__desc">{{ profile?.mfaEnabled ? '已开启' : '未开启 · 平台打通后可用' }}</div>
                </div>
              </div>
              <a-switch :model-value="!!profile?.mfaEnabled" disabled />
            </div>
          </div>
          <div class="uc-subpanel">
            <div class="uc-row">
              <div class="uc-row__left">
                <div class="uc-row__icon t-blue"><icon-apps /></div>
                <div>
                  <div class="uc-row__title">第三方 OAuth 授权</div>
                  <div class="uc-row__desc">已授权 {{ apps.length }} 个应用</div>
                </div>
              </div>
              <a-button size="small" @click="openApps">管理授权</a-button>
            </div>
          </div>
        </div>

        <!-- ③ 通知偏好 -->
        <div ref="cardNotify" id="notify" class="uc-card">
          <div class="uc-card__head">
            <div class="uc-card__icon"><icon-notification /></div>
            <div class="uc-card__title">通知偏好</div>
          </div>
          <div v-for="(n, i) in notifyItems" :key="n.key" class="uc-row" :class="{ 'uc-row--split': i > 0 }">
            <div class="uc-row__left">
              <div class="uc-row__icon t-gray"><icon-notification /></div>
              <div>
                <div class="uc-row__title">{{ n.label }}</div>
                <div class="uc-row__desc">{{ n.desc }}</div>
              </div>
            </div>
            <a-switch :model-value="notifyPrefs[n.key]" @change="(v: any) => setNotify(n.key, !!v)" />
          </div>
        </div>

        <!-- ④ 登录设备 -->
        <div ref="cardDevices" id="devices" class="uc-card">
          <div class="uc-card__head">
            <div class="uc-card__icon"><icon-desktop /></div>
            <div class="uc-card__title">登录设备</div>
            <div class="uc-card__spacer" />
            <a-button size="small" @click="loadDevices">
              <template #icon><icon-refresh /></template>
              刷新
            </a-button>
            <a-button size="small" status="danger" :disabled="!devices.length" @click="logoutAll">全部下线</a-button>
          </div>
          <div v-if="devicesLoading" class="uc-empty">加载中…</div>
          <div v-else-if="!devices.length" class="uc-empty">暂无有效的登录设备</div>
          <div v-else class="dev-list">
            <div v-for="d in devices" :key="d.id" class="dev-item">
              <div class="dev-item__icon" :class="{ 'is-mobile': d.systemType === 'MOBILE' }">
                <icon-mobile v-if="d.systemType === 'MOBILE'" />
                <icon-desktop v-else />
              </div>
              <div class="dev-item__main">
                <div class="dev-item__title">
                  {{ d.deviceName || (d.systemType === 'MOBILE' ? '移动端设备' : '浏览器会话') }}
                  <a-tag v-if="d.current" size="small" color="green">当前</a-tag>
                  <a-tag size="small" :color="d.systemType === 'MOBILE' ? 'arcoblue' : 'gray'">
                    {{ d.systemType === 'MOBILE' ? '移动端' : '电脑' }}
                  </a-tag>
                </div>
                <div class="dev-item__meta">
                  <span>{{ d.browser || '未知浏览器' }} · {{ d.os || '未知系统' }}</span>
                  <span class="dev-item__dot">·</span>
                  <span class="mono">{{ d.ip || '-' }}</span>
                </div>
                <div class="dev-item__time">
                  登录 {{ fmtTime(d.loginAt) }} · 最近活动 {{ fmtTime(d.lastAccessAt) }}
                </div>
              </div>
              <a-button size="small" type="text" status="danger" @click="onLogoutDevice(d)">下线</a-button>
            </div>
          </div>
          <div class="uc-dev-tip">下线后该设备需重新登录；移动端令牌会立即失效。</div>
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <a-modal v-model:visible="editVisible" title="编辑资料" :mask-closable="false" @before-ok="onSaveProfile">
      <a-form :model="form" layout="vertical">
        <a-form-item label="姓名"><a-input v-model="form.displayName" /></a-form-item>
        <a-form-item label="部门 / 厂区"><a-input v-model="form.department" /></a-form-item>
        <a-form-item label="邮箱"><a-input v-model="form.email" /></a-form-item>
        <a-form-item label="手机"><a-input v-model="form.phone" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码弹窗 -->
    <a-modal v-model:visible="pwdVisible" title="修改密码" :mask-closable="false" @before-ok="onSavePassword">
      <a-form :model="pwdForm" layout="vertical">
        <a-form-item label="原密码"><a-input-password v-model="pwdForm.oldPassword" /></a-form-item>
        <a-form-item label="新密码"><a-input-password v-model="pwdForm.newPassword" placeholder="至少 8 位" /></a-form-item>
        <a-form-item label="确认新密码"><a-input-password v-model="pwdForm.confirm" /></a-form-item>
      </a-form>
    </a-modal>

    <!-- 管理授权弹窗 -->
    <a-modal v-model:visible="appsVisible" title="第三方 OAuth 授权" :mask-closable="false" :footer="false" @cancel="appsVisible = false">
      <div v-if="!apps.length" class="uc-empty">暂无第三方授权（first-party 应用自动同意不产生记录）</div>
      <div v-for="a in apps" :key="a.clientId" class="uc-app">
        <div class="uc-app__info">
          <div class="uc-app__name">{{ a.clientName }}</div>
          <div class="uc-app__scopes">{{ a.scopes.join(' · ') || '无 scope' }}</div>
        </div>
        <a-button size="small" status="danger" @click="revokeApp(a)">撤销</a-button>
      </div>
    </a-modal>

    <!-- 我的角色权限弹窗 -->
    <a-modal v-model:visible="roleVisible" title="我的角色权限" :footer="false" @cancel="roleVisible = false">
      <div class="uc-roles-wrap">
        <div class="uc-roles-wrap__label">角色（含继承）</div>
        <div class="uc-roles-wrap__tags">
          <a-tag v-for="(r, i) in myRoleNames" :key="r" color="arcoblue">{{ r }}（{{ myRoles[i] }}）</a-tag>
        </div>
        <div class="uc-roles-wrap__label">权限点</div>
        <div class="uc-perms">
          <a-tag v-for="p in myPerms" :key="p" class="uc-perm">{{ p }}</a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Message, Modal } from '@arco-design/web-vue';
import {
  getUserInfo,
  updateMyProfile,
  changeMyPassword,
  myApplications,
  revokeApplication,
  listLoginDevices,
  logoutLoginDevice,
  logoutAllLoginDevices,
  authPermissions,
  getNotifyPrefs,
  saveNotifyPref,
} from '@/api/user';
import type { LoginDevice } from '@/api/user';
import { useUserStore } from '@/store';
import { themeState, setMode } from '@/config/themes';
import type { ModePref } from '@/config/themes';

const userStore = useUserStore();
const profile = ref<any>(null);
const myRoles = ref<string[]>([]);
const myRoleNames = ref<string[]>([]);
const myPerms = ref<string[]>([]);

/** 头像：后端已按 user.avatar → employee.avatar 优先级回带 */
const avatarUrl = computed(() => profile.value?.avatar || '');

const notifyItems = [
  { key: 'system', label: '系统通知', desc: '平台维护、安全提示等系统级通知' },
  { key: 'email', label: '邮件通知', desc: '通过邮箱接收关键事件' },
  { key: 'sms', label: '短信通知', desc: '通过短信接收验证类通知' },
];
const notifyPrefs = ref<Record<string, boolean>>({ system: true, email: true, sms: false });
async function loadNotifyPrefs() {
  try {
    const res = await getNotifyPrefs();
    notifyPrefs.value = { system: true, email: true, sms: false, ...(res.data || {}) };
  } catch {
    /* 保留默认值 */
  }
}
function setNotify(key: string, v: boolean) {
  notifyPrefs.value[key] = v;
  saveNotifyPref(key, v);
}

// 主题偏好直接读写模板主题状态，切换即时生效（无需 reload）
const themeMode = computed(() => (themeState.pref === 'system' ? 'light' : themeState.pref));
function onThemeChange(v: any) {
  const val = v?.target ? v.target.value : String(v);
  if (val === 'light' || val === 'dark') setMode(val as ModePref);
}

const landingPage = computed(() => localStorage.getItem('adt.user.landing') || '/dashboard/console');
function onLandingChange(v: any) {
  const val = v?.target ? v.target.value : String(v);
  localStorage.setItem('adt.user.landing', val || '/dashboard/console');
  Message.success('默认落地页已保存');
}

const pwdChangedAt = computed(() => {
  const t = profile.value?.passwordChangedAt;
  return t ? String(t).slice(0, 10) : '—';
});

const navItems = [
  { key: 'profile', label: '基本资料' },
  { key: 'security', label: '安全设置' },
  { key: 'notify', label: '通知偏好' },
  { key: 'devices', label: '登录设备' },
  { key: 'roles', label: '我的角色与权限' },
];
const activeNav = ref('profile');
const cardProfile = ref<HTMLElement | null>(null);
const cardSecurity = ref<HTMLElement | null>(null);
const cardNotify = ref<HTMLElement | null>(null);
const cardDevices = ref<HTMLElement | null>(null);

function onNav(m: { key: string; label: string }) {
  if (m.key === 'roles') {
    roleVisible.value = true;
    return;
  }
  if (m.key === 'devices') loadDevices();
  const map: Record<string, HTMLElement | null> = {
    profile: cardProfile.value,
    security: cardSecurity.value,
    notify: cardNotify.value,
    devices: cardDevices.value,
  };
  map[m.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  activeNav.value = m.key;
}

/* ---------------- 头像上传：本地压缩成小图 data URL 再落库 ---------------- */
const avatarInput = ref<HTMLInputElement | null>(null);
function onChangeAvatar() {
  avatarInput.value?.click();
}

/** 居中裁剪为正方形 + 缩放到 side×side 的 JPEG data URL（约 10~30KB）。 */
function compressAvatar(file: File, side = 160, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('图片解析失败'));
      img.onload = () => {
        const edge = Math.min(img.width, img.height);
        const sx = (img.width - edge) / 2;
        const sy = (img.height - edge) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = side;
        canvas.height = side;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('当前浏览器不支持头像处理'));
          return;
        }
        ctx.drawImage(img, sx, sy, edge, edge, 0, 0, side, side);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function onAvatarPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    if (!file.type.startsWith('image/')) {
      Message.error('请选择图片文件（PNG / JPG / WEBP）');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Message.error('原始图片不能超过 5MB');
      return;
    }
    const dataUrl = await compressAvatar(file);
    await updateMyProfile({ avatar: dataUrl });
    Message.success('头像已更新');
    await load();
  } catch (err: any) {
    Message.error(err?.message || '头像更新失败');
  } finally {
    input.value = '';
  }
}

async function load() {
  try {
    const res = await getUserInfo();
    profile.value = res.data || {};
    // 同步到全局 store，使 header 头像/姓名即时更新
    userStore.setInfo({
      name: profile.value.displayName || profile.value.username,
      avatar: profile.value.avatar,
    });
    const perm = await authPermissions();
    myRoles.value = perm.data?.roles || [];
    myRoleNames.value = perm.data?.roleNames || perm.data?.roles || [];
    myPerms.value = perm.data?.permissions || [];
  } catch (e) {
    /* toast by interceptor */
  }
}

const editVisible = ref(false);
const form = reactive<{ displayName?: string; department?: string; email?: string; phone?: string }>({});
function openEditProfile() {
  Object.assign(form, {
    displayName: profile.value?.displayName ?? '',
    department: profile.value?.department ?? '',
    email: profile.value?.email ?? '',
    phone: profile.value?.phone ?? '',
  });
  editVisible.value = true;
}
async function onSaveProfile(): Promise<boolean> {
  try {
    await updateMyProfile({ ...form });
    Message.success('资料已更新');
    editVisible.value = false;
    load();
    return true;
  } catch (e) {
    return false;
  }
}

const pwdVisible = ref(false);
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirm: '' });
function openChangePwd() {
  Object.assign(pwdForm, { oldPassword: '', newPassword: '', confirm: '' });
  pwdVisible.value = true;
}
async function onSavePassword(): Promise<boolean> {
  if (pwdForm.newPassword !== pwdForm.confirm) {
    Message.error('两次输入的新密码不一致');
    return false;
  }
  try {
    await changeMyPassword({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
    Modal.success({ title: '密码修改成功', content: '请使用新密码登录。' });
    pwdVisible.value = false;
    return true;
  } catch (e) {
    return false;
  }
}

const appsVisible = ref(false);
const apps = ref<any[]>([]);
async function openApps() {
  appsVisible.value = true;
  await loadApps();
}
async function loadApps() {
  try {
    const res = await myApplications();
    apps.value = res.data || [];
  } catch (e) {
    apps.value = [];
  }
}
async function revokeApp(a: any) {
  Modal.confirm({
    title: '撤销授权',
    content: `撤销对「${a.clientName}」的授权后，该应用需重新获取您的同意。`,
    onOk: async () => {
      try {
        await revokeApplication(a.clientId);
        Message.success('已撤销授权');
        loadApps();
      } catch (e) {
        /* toast */
      }
    },
  });
}

const roleVisible = ref(false);

/* ---------------- 登录设备（真实台账） ---------------- */
const devices = ref<LoginDevice[]>([]);
const devicesLoading = ref(false);
function fmtTime(t?: string) {
  if (!t) return '—';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
async function loadDevices() {
  devicesLoading.value = true;
  try {
    const res = await listLoginDevices();
    devices.value = res.data || [];
  } catch (e) {
    devices.value = [];
  } finally {
    devicesLoading.value = false;
  }
}
function onLogoutDevice(d: LoginDevice) {
  Modal.confirm({
    title: '下线设备',
    content: `确认将「${d.deviceName || d.deviceId}」下线吗？该设备需要重新登录。`,
    okText: '确认下线',
    onOk: async () => {
      try {
        await logoutLoginDevice(d.id);
        Message.success('设备已下线');
        if (d.current) {
          await userStore.logout();
          window.location.href = '/login';
          return;
        }
        loadDevices();
      } catch (e) {
        /* toast by interceptor */
      }
    },
  });
}

async function logoutAll() {
  Modal.confirm({
    title: '全部下线',
    content: '确认下线当前账号的所有登录设备吗？包括本机与移动端，所有设备都需重新登录。',
    okText: '全部下线',
    onOk: async () => {
      try {
        await logoutAllLoginDevices();
        Message.success('已下线全部设备');
        await userStore.logout();
        window.location.href = '/login';
      } catch (e) {
        /* toast by interceptor */
      }
    },
  });
}

onMounted(() => {
  load();
  loadDevices();
  loadNotifyPrefs();
});
</script>

<style scoped lang="less">
.user-page {
  display: flex;
  justify-content: center;
}
.uc-body {
  display: flex;
  align-items: stretch; /* 关键：左侧面板「拉通」到与右侧内容等高 */
  gap: 16px;
  width: 100%;
  max-width: 1240px;
}

/* 左侧设置导航：单一面板 + 内嵌用户卡 */
.uc-nav {
  width: 300px;
  flex-shrink: 0;
  box-sizing: border-box;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 14px;
  padding: 16px;

  &__inner {
    position: sticky;
    top: 16px;
  }

  &__user {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 原型：用户卡比外层面板「更深」一档。--color-bg-1 在明暗两套下都比 --color-bg-2 更深
       （fill-1 在暗色下反而更亮，会与原型方向相反），故用 bg-1。 */
    background: var(--color-bg-1);
    border: 1px solid var(--color-border-2);
    border-radius: 12px;
    padding: 20px 16px;
  }

  &__menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 16px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 40px;
    box-sizing: border-box;
    padding: 0 16px;
    border: 1px solid transparent;
    border-radius: 10px;
    font-size: 13px;
    color: var(--color-text-3);
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    :deep(.arco-icon) { font-size: 17px; }

    &:hover {
      color: var(--color-text-1);
      background: var(--color-fill-1);
    }
    &.is-active {
      color: var(--color-text-1);
      font-weight: 500;
      background: rgba(var(--primary-6), 0.1);
      border-color: rgba(var(--primary-6), 0.35);
      :deep(.arco-icon) { color: rgb(var(--primary-6)); }
    }
  }
}

.uc-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: rgb(var(--primary-6));
  background: rgba(var(--primary-6), 0.12);
  img { width: 100%; height: 100%; display: block; object-fit: cover; }
}
.uc-user-name {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text-1);
}
.uc-user-sub {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--color-text-3);
}
.uc-user-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  min-height: 22px;
}
.uc-role-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 5px;
  border: 1px solid rgba(var(--primary-6), 0.35);
  background: rgba(var(--primary-6), 0.1);
  color: rgb(var(--primary-6));
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
.uc-avatar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
  padding: 0;
  border: none;
  background: none;
  color: rgb(var(--primary-6));
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  :deep(.arco-icon) { font-size: 14px; }
  &:hover { text-decoration: underline; }
}
.uc-avatar-file { display: none; }

.uc-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-behavior: smooth;
}
.uc-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border-2);
  border-radius: 14px;
  padding: 20px 22px;
  scroll-margin-top: 12px;
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }
  &__icon {
    display: flex;
    align-items: center;
    font-size: 18px;
    color: rgb(var(--primary-6));
  }
  &__title { font-size: 16px; font-weight: 600; color: var(--color-text-1); }
  &__spacer { flex: 1; }
}
.uc-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px 24px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.uc-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  &__label { font-size: 12px; color: var(--color-text-3); }
  :deep(.arco-select) { width: 100%; }
}
.uc-subpanel {
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 12px;
  &:first-of-type { margin-top: 0; }
}
.uc-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
  &--split { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--color-border-2); }
  &__left { display: flex; align-items: center; gap: 16px; }
  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    &.t-primary { color: rgb(var(--primary-6)); background: rgba(var(--primary-6), 0.1); }
    &.t-success { color: rgb(var(--green-6)); background: rgba(var(--green-6), 0.1); }
    &.t-blue { color: rgb(var(--arcoblue-6)); background: rgba(var(--arcoblue-6), 0.1); }
    &.t-gray { color: var(--color-text-3); background: var(--color-fill-2); }
  }
  &__title { color: var(--color-text-1); font-weight: 600; font-size: 14px; }
  &__desc { margin-top: 2px; color: var(--color-text-3); font-size: 12px; }
}
.uc-app {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  &:not(:last-child) { border-bottom: 1px dashed var(--color-border-2); }
  &__name { color: var(--color-text-1); font-weight: 500; }
  &__scopes { margin-top: 2px; color: var(--color-text-3); font-size: 12px; }
}
.dev-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  overflow: hidden;
}
.dev-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  &:not(:last-child) { border-bottom: 1px dashed var(--color-border-2); }
  &__icon {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    color: var(--color-text-3);
    background: var(--color-fill-2);
    &.is-mobile { color: rgb(var(--arcoblue-6)); background: rgba(var(--arcoblue-6), 0.1); }
  }
  &__main { flex: 1; min-width: 0; }
  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    color: var(--color-text-1);
    font-weight: 600;
    font-size: 14px;
  }
  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    color: var(--color-text-3);
    font-size: 12px;
    flex-wrap: wrap;
  }
  &__dot { opacity: 0.6; }
  &__time { margin-top: 2px; color: var(--color-text-4); font-size: 11px; }
}
.uc-dev-tip {
  margin-top: 10px;
  color: var(--color-text-3);
  font-size: 12px;
}
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.uc-empty { color: var(--color-text-3); text-align: center; padding: 24px 0; }
.uc-roles-wrap {
  &__label { color: var(--color-text-3); margin: 12px 0 8px; &:first-child { margin-top: 0; } }
  &__tags { display: flex; gap: 8px; flex-wrap: wrap; }
}
.uc-perms { display: flex; gap: 6px; flex-wrap: wrap; max-height: 240px; overflow: auto; }
.uc-perm { font-family: monospace; font-size: 12px; }
</style>
