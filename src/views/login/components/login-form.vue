<template>
  <a-form
    ref="formRef"
    :model="form"
    :rules="rules"
    layout="vertical"
    class="login-form"
    @submit-success="onSubmit"
  >
    <template v-if="!hideHead">
      <div class="login-form__hello">{{ $t('login.form.hello') }}</div>
      <div class="login-form__title">{{ $t('login.form.title') }}</div>
    </template>
    <div class="login-form__signup">
      {{ $t('login.form.noAccount') }}
      <a-link @click="onSignup">{{ $t('login.form.signup') }}</a-link>
    </div>

    <div class="login-form__tabs">
      <button
        type="button"
        :class="['login-form__tab', { active: mode === 'password' }]"
        @click="switchMode('password')"
      >
        {{ $t('login.form.tabPassword') }}
      </button>
      <button
        type="button"
        :class="['login-form__tab', { active: mode === 'phone' }]"
        @click="switchMode('phone')"
      >
        {{ $t('login.form.tabPhone') }}
      </button>
    </div>

    <a-alert v-if="errorMsg" type="error" :message="errorMsg" closable class="login-form__alert" />

    <template v-if="mode === 'password'">
      <a-form-item field="username" :label="$t('login.form.userName.label')">
        <a-input
          v-model="form.username"
          :placeholder="$t('login.form.userName.placeholder')"
          allow-clear
          size="large"
        >
          <template #prefix><icon-user /></template>
        </a-input>
      </a-form-item>
      <a-form-item field="password" :label="$t('login.form.password.label')">
        <a-input-password
          v-model="form.password"
          :placeholder="$t('login.form.password.placeholder')"
          allow-clear
          size="large"
        >
          <template #prefix><icon-lock /></template>
        </a-input-password>
      </a-form-item>
    </template>
    <template v-else>
      <a-form-item field="phone" :label="$t('login.form.phone.label')">
        <a-input
          v-model="form.phone"
          :placeholder="$t('login.form.phone.placeholder')"
          allow-clear
          size="large"
        >
          <template #prefix><icon-mobile /></template>
        </a-input>
      </a-form-item>
      <a-form-item field="code" :label="$t('login.form.code.label')">
        <a-input v-model="form.code" :placeholder="$t('login.form.code.placeholder')" size="large">
          <template #prefix><icon-email /></template>
          <template #append>
            <a-button type="text" :loading="sending" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : $t('login.form.code.send') }}
            </a-button>
          </template>
        </a-input>
      </a-form-item>
    </template>

    <div class="login-form__options">
      <a-checkbox v-model="remember">{{ $t('login.form.rememberPassword') }}</a-checkbox>
      <a-link @click="onForgot">{{ $t('login.form.forgetPassword') }}</a-link>
    </div>

    <a-button type="primary" long size="large" :loading="loading" html-type="submit" class="login-form__submit">
      {{ $t('login.form.login') }}
    </a-button>

    <a-divider class="login-form__divider">{{ $t('login.form.otherLogin') }}</a-divider>
    <div class="login-form__social">
      <a-tooltip v-for="item in socialProviders" :key="item.key" :content="item.label">
        <a-button class="login-form__social-btn" shape="circle" size="large" @click="onSocial(item.key)">
          <component :is="item.icon" />
        </a-button>
      </a-tooltip>
    </div>

    <div v-if="appConfig.mock.enabled" class="login-form__demo">
      {{ $t('login.form.demo') }}：{{ appConfig.mock.username }} / {{ appConfig.mock.password }}
    </div>
  </a-form>
</template>

<script setup lang="ts">
  import { computed, onUnmounted, reactive, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import type { FieldRule, FormInstance } from '@arco-design/web-vue';
  import IconWechat from '@arco-design/web-vue/es/icon/icon-wechat';
  import IconQq from '@arco-design/web-vue/es/icon/icon-qq';
  import IconWeibo from '@arco-design/web-vue/es/icon/icon-weibo';
  import { useUserStore } from '@/store';
  import { appConfig } from '@/config/app-config';
  import { loginByPhone, loginRequest, sendSmsCode, socialLogin } from '@/api/user';

  defineProps<{
    /** 为 true 时隐藏表单自带的标题区（外层页面已自行渲染卡片头部） */
    hideHead?: boolean;
  }>();

  type Mode = 'password' | 'phone';
  const form = reactive({ username: '', password: '', phone: '', code: '' });
  const mode = ref<Mode>('password');
  const remember = ref(true);
  const loading = ref(false);
  const sending = ref(false);
  const countdown = ref(0);
  const errorMsg = ref('');
  const formRef = ref<FormInstance>();
  const route = useRoute();
  const router = useRouter();
  const userStore = useUserStore();
  let timer: number | undefined;

  const passwordRules: Record<string, FieldRule[]> = {
    username: [{ required: true, message: '请输入用户名' }],
    password: [{ required: true, message: '请输入密码' }],
  };
  const phoneRules: Record<string, FieldRule[]> = {
    phone: [
      { required: true, message: '请输入手机号' },
      { match: /^1\d{10}$/, message: '手机号格式不正确' },
    ],
    code: [{ required: true, message: '请输入验证码' }],
  };
  const rules = computed<Record<string, FieldRule[]>>(() =>
    mode.value === 'password' ? passwordRules : phoneRules
  );

  const socialProviders = [
    { key: 'wechat' as const, label: '微信登录', icon: IconWechat },
    { key: 'qq' as const, label: 'QQ 登录', icon: IconQq },
    { key: 'weibo' as const, label: '微博登录', icon: IconWeibo },
  ];

  function switchMode(next: Mode) {
    mode.value = next;
    errorMsg.value = '';
    formRef.value?.resetFields();
  }

  function redirectTarget() {
    const redirect = route.query.redirect;
    return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/login')
      ? redirect
      : '/dashboard/console';
  }

  async function finishLogin(action: Promise<unknown>) {
    errorMsg.value = '';
    loading.value = true;
    try {
      await action;
      await userStore.info();
      Message.success('登录成功');
      window.location.href = redirectTarget();
    } catch (error: any) {
      errorMsg.value = error?.response?.data?.message || '登录失败，请稍后重试';
      loading.value = false;
    }
  }

  async function onSubmit() {
    if (mode.value === 'password') {
      await finishLogin(loginRequest({ username: form.username, password: form.password }));
    } else {
      await finishLogin(loginByPhone(form.phone, form.code));
    }
  }

  async function sendCode() {
    if (!/^1\d{10}$/.test(form.phone)) {
      Message.warning('请先输入正确的手机号');
      return;
    }
    sending.value = true;
    try {
      const res = await sendSmsCode(form.phone);
      Message.success(res.data?.message || '验证码已发送');
      countdown.value = 60;
      timer = window.setInterval(() => {
        countdown.value -= 1;
        if (countdown.value <= 0) window.clearInterval(timer);
      }, 1000);
    } catch {
      /* 错误提示由拦截器统一处理 */
    } finally {
      sending.value = false;
    }
  }

  async function onSocial(provider: 'wechat' | 'qq' | 'weibo') {
    await finishLogin(socialLogin(provider));
  }

  function onForgot() {
    Message.info('演示模板：请按实际系统接入找回密码流程');
  }

  function onSignup() {
    Message.info('演示模板：请按实际系统接入注册流程');
  }

  onUnmounted(() => window.clearInterval(timer));
</script>

<style scoped lang="less">
  .login-form {
    width: 100%;

    &__hello {
      color: var(--color-text-3);
      font-size: 14px;
    }

    &__title {
      margin-top: 4px;
      color: var(--color-text-1);
      font-size: 26px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    &__signup {
      margin-top: 8px;
      color: var(--color-text-3);
      font-size: 13px;
    }

    &__tabs {
      display: flex;
      gap: 28px;
      margin: 22px 0 20px;
      border-bottom: 1px solid var(--color-border-2);
    }

    &__tab {
      position: relative;
      margin-bottom: -1px;
      padding: 0 0 12px;
      border: 0;
      background: transparent;
      color: var(--color-text-3);
      cursor: pointer;
      font-size: 14px;

      &.active {
        border-bottom: 2px solid rgb(var(--primary-6));
        color: rgb(var(--primary-6));
        font-weight: 600;
      }
    }

    &__alert {
      margin-bottom: 16px;
    }

    &__options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 2px 0 20px;
      font-size: 13px;
    }

    &__submit {
      height: 42px;
    }

    &__divider {
      margin: 24px 0 18px;
      color: var(--color-text-4);
      font-size: 12px;
    }

    &__social {
      display: flex;
      justify-content: center;
      gap: 22px;
    }

    &__social-btn {
      color: var(--color-text-2);
      font-size: 18px;
    }

    &__demo {
      margin-top: 22px;
      color: var(--color-text-4);
      font-size: 12px;
      text-align: center;
    }
  }
</style>
