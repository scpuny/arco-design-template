<template>
  <div class="global-loading" role="status" aria-live="polite" aria-busy="true">
    <!-- 全屏半透明底：遮住未就绪内容 -->
    <div class="global-loading__backdrop" />

    <!-- 半透明框：包住 SVG 动画 -->
    <div class="global-loading__box">
      <svg
        class="gl-svg"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- 轨道环 -->
        <circle class="gl-track" cx="60" cy="60" r="44" />
        <circle class="gl-track gl-track--inner" cx="60" cy="60" r="30" />

        <!-- 外弧：顺时针 -->
        <g class="gl-spin">
          <circle class="gl-arc" cx="60" cy="60" r="44" />
        </g>

        <!-- 内弧：逆时针，速度略慢 -->
        <g class="gl-spin gl-spin--rev">
          <circle class="gl-arc gl-arc--inner" cx="60" cy="60" r="30" />
        </g>

        <!-- 中心呼吸点 -->
        <circle class="gl-dot" cx="60" cy="60" r="6" />
      </svg>

      <div class="global-loading__tip">{{ tip }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  withDefaults(defineProps<{ tip?: string }>(), { tip: '页面加载中…' });
</script>

<style scoped lang="less">
  /* 颜色全部走 Arco 系统 token，明暗主题自动适配 */
  .global-loading {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: gl-fade-in 160ms ease-out;
  }

  .global-loading__backdrop {
    position: absolute;
    inset: 0;
    background-color: var(--color-bg-1);
    opacity: 0.62;
    backdrop-filter: blur(2px);
  }

  .global-loading__box {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 28px 34px 24px;
    border: 1px solid var(--color-border-2);
    border-radius: 16px;
    background-color: var(--color-bg-2);
    box-shadow: var(--adt-t-card-shadow);
    opacity: 0.9;
    /* 只做位移/缩放，透明度交给外层 gl-fade-in，避免叠加两次淡入导致框一直是淡的 */
    animation: gl-pop 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .global-loading__tip {
    color: var(--color-text-2);
    font-size: 13px;
    letter-spacing: 0.4px;
  }

  .gl-svg {
    width: 76px;
    height: 76px;
    overflow: visible;
  }

  .gl-track {
    fill: none;
    stroke: var(--color-fill-3);
    stroke-width: 5;

    &--inner {
      stroke-width: 4;
    }
  }

  .gl-arc {
    fill: none;
    stroke: rgb(var(--primary-6));
    stroke-width: 5;
    stroke-linecap: round;
    /* 约 1/4 圈的一段弧（周长 2πr ≈ 276） */
    stroke-dasharray: 70 300;

    &--inner {
      stroke: rgb(var(--primary-4));
      stroke-width: 4;
      stroke-dasharray: 44 240;
    }
  }

  .gl-dot {
    fill: rgb(var(--primary-6));
    transform-box: fill-box;
    transform-origin: center;
    animation: gl-pulse 1.2s ease-in-out infinite;
  }

  .gl-spin {
    transform-box: fill-box;
    transform-origin: center;
    animation: gl-spin 1s linear infinite;

    &--rev {
      animation-duration: 1.45s;
      animation-direction: reverse;
    }
  }

  @keyframes gl-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes gl-pulse {
    0%,
    100% {
      opacity: 0.45;
      transform: scale(0.7);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes gl-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes gl-pop {
    from {
      transform: translateY(8px) scale(0.94);
    }
    to {
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .gl-spin,
    .gl-dot {
      animation-duration: 3s;
    }
  }
</style>
