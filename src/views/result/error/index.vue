<template>
  <a-card :bordered="false" class="result-card">
    <div class="result-body">
      <div class="result-icon result-icon--error"><icon-close-circle /></div>
      <a-typography-title :heading="4">{{ $t('result.errorTitle') }}</a-typography-title>
      <a-typography-paragraph type="secondary">
        {{ $t('result.errorDesc') }}
      </a-typography-paragraph>
      <a-space>
        <a-button type="primary" @click="$router.push('/dashboard/console')">
          {{ $t('result.backHome') }}
        </a-button>
        <a-button @click="$router.back()">{{ $t('result.goBack') }}</a-button>
      </a-space>
    </div>
  </a-card>
</template>

<style scoped lang="less">
  .result-card {
    min-height: 480px;
  }

  .result-body {
    display: flex;
    min-height: 420px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .result-icon {
    display: flex;
    width: 72px;
    height: 72px;
    margin-bottom: 20px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 44px;

    &--error {
      background: rgb(var(--red-1));
      color: rgb(var(--red-6));
    }
  }
</style>
