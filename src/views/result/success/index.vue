<template>
  <a-card :bordered="false" class="result-card">
    <div class="result-body">
      <div class="result-icon result-icon--success"><icon-check-circle /></div>
      <a-typography-title :heading="4">{{ $t('result.successTitle') }}</a-typography-title>
      <a-typography-paragraph type="secondary">
        {{ $t('result.successDesc') }}
      </a-typography-paragraph>
      <a-space>
        <a-button type="primary" @click="$router.push('/dashboard/console')">
          {{ $t('result.backHome') }}
        </a-button>
        <a-button @click="$router.push('/form/basic')">{{ $t('result.continue') }}</a-button>
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

    &--success {
      background: rgb(var(--green-1));
      color: rgb(var(--green-6));
    }
  }
</style>
