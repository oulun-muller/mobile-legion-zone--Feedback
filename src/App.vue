<script setup lang="ts">
import { RouterView } from 'vue-router'
import DevUploadMockBar from '@/components/DevUploadMockBar.vue'
import ToastHost from '@/components/ToastHost.vue'
</script>

<template>
  <RouterView />
  <ToastHost />
  <DevUploadMockBar />
</template>
