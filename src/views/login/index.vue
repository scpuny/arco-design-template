<template>
  <div class="login-page">
    <!-- 背景装饰层：跟随主题的柔和渐变 + 细网格 + 深色薄纱（保证左右文字对比度） -->
    <div class="login-page__bg" aria-hidden="true">
      <div class="login-page__grid"></div>
      <div class="login-page__veil"></div>
    </div>

    <div class="login-page__body">
      <!-- 左侧品牌区 -->
      <div class="brand">
        <div class="brand__top">
          <img src="@/assets/logo.svg?url" class="brand__logo" alt="logo" />
          <span class="brand__name">{{ appConfig.title }}</span>
        </div>

        <div class="brand__content">
          <h1 class="brand__headline">
            {{ $t('login.platform.title') }}
          </h1>
          <p class="brand__tagline">{{ $t('login.platform.tagline') }}</p>

          <div class="brand__preview" aria-hidden="true">
            <div class="brand__preview-bar">
              <span></span><span></span><span></span>
            </div>
            <div class="brand__preview-main">
              <div class="brand__stat">
                <div class="brand__stat-num">12,840</div>
                <div class="brand__stat-label">本周活跃</div>
              </div>
              <div class="brand__bars">
                <i v-for="(h, i) in [42, 68, 54, 80, 62, 92, 74]" :key="i" :style="{ height: h + '%' }"></i>
              </div>
            </div>
            <div class="brand__preview-foot">
              <span class="brand__chip brand__chip--a">流程</span>
              <span class="brand__chip brand__chip--b">资产</span>
              <span class="brand__chip brand__chip--c">计量</span>
            </div>
          </div>

          <ul class="brand__features">
            <li v-for="n in [1, 2, 3]" :key="n" class="brand__feature">
              <span class="brand__feature-dot"></span>
              <span>
                <strong>{{ $t('login.platform.feature' + n + '.label') }}</strong>
                <small>{{ $t('login.platform.feature' + n + '.desc') }}</small>
              </span>
            </li>
          </ul>
        </div>

        <div class="brand__bottom">
          <icon-check-circle-fill class="brand__safe-icon" />
          <span>{{ $t('login.platform.security') }}</span>
        </div>
      </div>

      <!-- 右侧登录卡片区 -->
      <div class="pane">
        <div class="pane__top">
          <a-dropdown trigger="click">
            <button class="pane__locale">
              <icon-language />
              <span>{{ currentLocaleLabel }}</span>
              <icon-down />
            </button>
            <template #content>
              <a-doption
                v-for="item in LOCALE_OPTIONS"
                :key="item.value"
                :class="{ active: locale === item.value }"
                @click="switchLocale(item.value)"
              >
                {{ item.label }}
              </a-doption>
            </template>
          </a-dropdown>
        </div>

        <div class="pane__card">
          <div class="pane__card-head">
            <div>
              <div class="pane__hello">{{ $t('login.form.hello') }}</div>
              <div class="pane__title">{{ $t('login.form.title') }}</div>
            </div>
          </div>
          <LoginForm :hide-head="true" />
        </div>

        <div class="pane__footer">{{ appConfig.copyright }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import LoginForm from './components/login-form.vue';
  import { appConfig } from '@/config/app-config';
  import { LOCALE_OPTIONS } from '@/locale';

  const { locale } = useI18n();
  const currentLocaleLabel = computed(
    () => LOCALE_OPTIONS.find((item) => item.value === locale.value)?.label || locale.value
  );

  function switchLocale(value: string) {
    locale.value = value;
    localStorage.setItem('arco-locale', value);
  }
</script>

<style lang="less" scoped>
  @pad-v: 56px;
  @pad-l: 72px;

  // 主题色柔和底色：随 body[data-theme-adt] 的 --adt-t-accent 变化，换色板自动跟着走
  @accent: var(--adt-t-accent, #165dff);
  // 浅色主题：主色向「白」提亮成柔和底色（用户反馈「直接用主色 1 当背景太深」→ 掺白变浅）
  @accent-start-light: color-mix(in srgb, @accent 72%, #fff 28%);
  @accent-end-light: color-mix(in srgb, @accent 46%, #fff 54%);

  .login-page {
    position: relative;
    min-height: 100vh;
    overflow: hidden;
    color: #fff;
    // 默认按浅色渲染：主色向「白」提亮成柔和底色，纯线性渐变（无发光光斑）
    background-color: @accent-end-light;
    background-image: linear-gradient(135deg, @accent-start-light 0%, @accent-end-light 100%);

    &__bg {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    &__grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 52px 52px;
      mask-image: radial-gradient(1300px 900px at 40% 30%, #000 25%, transparent 80%);
    }

    // 左侧白字衬底：背景被调浅后，靠一道「左深右透明」的横向暗纱保住白字对比度；
    // 右侧 46% 基本是透明（那里是白色登录卡，压不压都一样）。
    &__veil {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        rgba(8, 14, 28, 0.46) 0%,
        rgba(8, 14, 28, 0.28) 34%,
        rgba(8, 14, 28, 0.1) 52%,
        rgba(8, 14, 28, 0) 72%
      );
    }

    &__body {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: stretch;
      min-height: 100vh;
    }
  }

  /* ---------- 左侧品牌区（放大 + 更宽松） ---------- */
  .brand {
    flex: 0 0 54%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px @pad-v @pad-v @pad-l;

    &__top {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    &__logo {
      width: 46px;
      height: 46px;
      border-radius: 11px;
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
    }

    &__name {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: #fff;
    }

    &__content {
      max-width: 620px;
      margin: 0 auto;
    }

    &__headline {
      margin: 0;
      font-size: 52px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: 1px;
      text-shadow: 0 4px 30px rgba(0, 0, 0, 0.35);
    }

    &__tagline {
      margin: 18px 0 40px;
      font-size: 18px;
      line-height: 1.7;
      color: rgba(255, 255, 255, 0.72);
      max-width: 480px;
    }

    // 玻璃拟态产品预览（放大）
    &__preview {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 26px 28px;
      margin-bottom: 44px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(16px);
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.4);
      max-width: 520px;
    }

    &__preview-bar {
      display: flex;
      gap: 7px;

      span {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.28);

        &:nth-child(1) { background: #ff6b6b; }
        &:nth-child(2) { background: #ffd166; }
        &:nth-child(3) { background: #6ee7b7; }
      }
    }

    &__preview-main {
      display: flex;
      align-items: flex-end;
      gap: 28px;
      padding: 10px 0 4px;
    }

    &__stat {
      flex: 0 0 auto;

      &-num {
        font-size: 40px;
        font-weight: 700;
        color: #fff;
      }

      &-label {
        margin-top: 4px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.55);
      }
    }

    &__bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 9px;
      height: 112px;

      i {
        flex: 1;
        border-radius: 5px 5px 0 0;
        background: linear-gradient(180deg, var(--adt-t-accent, #165dff) 0%, var(--adt-t-accent, #14c9c9) 120%);
        animation: loginBar 1.1s ease both;
      }
    }

    &__preview-foot {
      display: flex;
      gap: 10px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
    }

    &__chip {
      padding: 5px 14px;
      border-radius: 22px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.1);

      &--a { color: #9ec5ff; }
      &--b { color: #9beee8; }
      &--c { color: #ffd9a0; }
    }

    &__features {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      max-width: 560px;
    }

    &__feature {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;

      > span {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      strong {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
      }

      small {
        font-size: 13px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.58);
      }
    }

    &__feature-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--adt-t-accent, #165dff);
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--adt-t-accent, #165dff) 24%, transparent);
    }

    &__bottom {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.55);
      font-size: 14px;
    }

    &__safe-icon {
      color: #36d399;
      font-size: 18px;
    }
  }

  /* ---------- 右侧登录区 ---------- */
  .pane {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    // 右侧留更多呼吸空间，把卡片往中左挪，避免贴近屏幕右边界（更大气）
    padding: @pad-v 96px @pad-v 56px;

    &__top {
      position: absolute;
      top: 24px;
      right: 32px;
    }

    &__locale {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 8px 14px;
      border-radius: 9px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    }

    &__card {
      width: 100%;
      max-width: 460px;
      padding: 48px 44px 40px;
      border-radius: 22px;
      background: #fff;
      color: var(--color-text-1);
      box-shadow: 0 44px 100px rgba(0, 0, 0, 0.5);
    }

    &__card-head {
      margin-bottom: 8px;
    }

    &__hello {
      color: var(--color-text-3);
      font-size: 14px;
    }

    &__title {
      margin-top: 5px;
      color: var(--color-text-1);
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    &__footer {
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      color: rgba(255, 255, 255, 0.35);
      font-size: 12px;
    }
  }

  @media (max-width: 1100px) {
    .brand {
      flex: 0 0 48%;
      padding: 40px @pad-v @pad-v 56px;

      &__headline { font-size: 42px; }
      &__features { grid-template-columns: 1fr; gap: 20px; }
    }
  }

  @media (max-width: 960px) {
    .brand {
      display: none;
    }

    .pane {
      flex: 1;
      padding: @pad-v 24px;
    }
  }

  @keyframes loginBar {
    from { transform: scaleY(0.2); opacity: 0.4; }
    to { transform: scaleY(1); opacity: 1; }
  }
</style>

<!-- 暗色主题覆盖：放非 scoped 块，直接以 body[arco-theme="dark"] 全局命中，
     主色向「深」压低，与明暗系统同步（浅色=提亮变浅 / 暗色=压低变深）。 -->
<style lang="less">
  @accent-ld: var(--adt-t-accent, #165dff);
  @login-soft-dark-start: color-mix(in srgb, @accent-ld 92%, #000 8%);
  @login-soft-dark-end: color-mix(in srgb, @accent-ld 40%, #12080a 60%);

  body[arco-theme='dark'] .login-page {
    background-color: @login-soft-dark-end;
    background-image: linear-gradient(135deg, @login-soft-dark-start 0%, @login-soft-dark-end 100%);
  }
</style>
