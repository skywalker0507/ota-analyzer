<script setup lang="ts">
import { onMounted } from 'vue'
import PayloadDetail from '@/components/PayloadDetail.vue'
import PayloadComposition from '@/components/PayloadComposition.vue'
import { useOtaStore } from '@/stores/ota'

const store = useOtaStore()

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}files/cf_x86_demo.zip`)
    if (!response.ok) {
      throw new Error('Demo OTA not found')
    }
    const blob = await response.blob()
    await store.unpackOTA(new File([blob], 'ota_demo.zip'))
  } catch (err) {
    console.warn('Please put a proper example OTA in /public/files/', err)
  }
})
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <PayloadDetail v-if="store.zipFile && store.payload" />
    </v-col>
    <v-divider vertical />
    <v-col cols="12" md="6">
      <PayloadComposition v-if="store.zipFile && store.payload?.manifest" demo />
    </v-col>
  </v-row>
</template>
