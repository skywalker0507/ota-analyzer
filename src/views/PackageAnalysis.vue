<script setup lang="ts">
import { storeToRefs } from 'pinia'
import BaseFile from '@/components/BaseFile.vue'
import PayloadDetail from '@/components/PayloadDetail.vue'
import PayloadComposition from '@/components/PayloadComposition.vue'
import { useOtaStore } from '@/stores/ota'

const store = useOtaStore()
const { zipFile, payload, loading, loadingMessage, error } = storeToRefs(store)

async function onFileSelect(file: File | URL) {
  await store.unpackOTA(file)
}
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-alert type="warning" variant="tonal" density="compact">
        Your files will not be uploaded anywhere. All analysis are done in the frontend using JavaScript.
      </v-alert>
    </v-col>
  </v-row>

  <v-alert
    v-if="error"
    type="error"
    variant="tonal"
    closable
    class="mb-4"
    @click:close="store.clearError()"
  >
    {{ error }}
  </v-alert>

  <v-progress-linear
    v-if="loading"
    indeterminate
    color="primary"
    class="mb-4"
  />
  <div v-if="loadingMessage" class="mb-4">{{ loadingMessage }}</div>

  <v-row>
    <v-col cols="12" md="6">
      <BaseFile
        label="Please drag and drop an OTA package or Select one"
        @file-select="onFileSelect"
      />
      <PayloadDetail v-if="zipFile && payload" />
    </v-col>
    <v-divider vertical />
    <v-col cols="12" md="6">
      <PayloadComposition v-if="zipFile && payload?.manifest" />
    </v-col>
  </v-row>
</template>
