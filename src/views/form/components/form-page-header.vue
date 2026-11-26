<template>
  <a-card :bordered="false" class="form-page-header">
    <a-space direction="vertical" :size="6">
      <a-typography-title :heading="5" style="margin: 0">
        {{ title }}
      </a-typography-title>
      <a-typography-text type="secondary" class="form-page-header__desc">
        {{ description }}
      </a-typography-text>
    </a-space>
  </a-card>
</template>

<script setup lang="ts">
  defineProps<{
    title: string;
    description: string;
  }>();
</script>

<style scoped lang="less">
  .form-page-header {
    margin-bottom: 16px;

    &__desc {
      font-size: 13px;
      line-height: 1.7;
    }
  }
</style>
