<template>
  <a-card :bordered="false" class="exception-card">
    <div class="exception-body">
      <div class="exception-code">{{ code }}</div>
      <a-typography-title :heading="4">{{ title }}</a-typography-title>
      <a-typography-paragraph type="secondary">{{ description }}</a-typography-paragraph>
      <a-button type="primary" @click="$router.push('/dashboard/console')">
        {{ $t('result.backHome') }}
      </a-button>
    </div>
  </a-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';

  const route = useRoute();
  const { t } = useI18n();
  const code = computed(() => String(route.meta.exceptionCode || '404'));
  const title = computed(() => t(`exception.${code.value}.title`));
  const description = computed(() => t(`exception.${code.value}.desc`));
</script>

<style scoped lang="less">
  .exception-card {
    min-height: 520px;
  }

  .exception-body {
    display: flex;
    min-height: 460px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .exception-code {
    color: rgb(var(--primary-6));
    font-size: 120px;
    font-weight: 700;
    line-height: 1.1;
    opacity: 0.85;
  }
</style>
