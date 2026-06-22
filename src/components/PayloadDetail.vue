<script setup lang="ts">
import { computed, ref } from 'vue'
import BasicInfo from './BasicInfo.vue'
import PartitionDetail from './PartitionDetail.vue'
import { octToHex } from '@/services/payload'
import { downloadFile, ensureSuffix, trimOTAPackage } from '@/services/trim_zip'
import { useOtaStore } from '@/stores/ota'

const store = useOtaStore()
const downloadNode = ref<HTMLAnchorElement | null>(null)

const dynamicPartitions = computed(
  () =>
    store.manifest?.dynamicPartitionMetadata?.groups?.flatMap(group => group.partitionNames || []) ??
    []
)

const payloadHash = computed(() => {
  const hash = store.payload?.getPayloadHash()
  return hash ? octToHex(hash, false) : ''
})

async function exportOTAPackage() {
  if (!store.payload || !store.zipFile || !downloadNode.value) {
    return
  }
  const blob = await trimOTAPackage(store.payload)
  downloadFile(
    blob,
    downloadNode.value,
    'trimmed_' + ensureSuffix(store.zipFile.getFileName(), '.zip')
  )
}
</script>

<template>
  <v-btn
    v-if="store.zipFile && store.payload"
    class="download-btn"
    block
    @click="exportOTAPackage"
  >
    Export Metadata
  </v-btn>
  <a ref="downloadNode" />
  <BasicInfo
    v-if="store.zipFile && store.payload"
    :zip-file="store.zipFile"
    :payload="store.payload"
    class="mb-5"
  />
  <v-divider />
  <div v-if="store.payload">
    <h3>Partition List</h3>
    <v-row v-if="store.manifest" class="mb-5">
      <v-col
        v-for="partition in store.manifest.partitions"
        :key="partition.partitionName"
        cols="12"
        md="4"
      >
        <v-card elevation="5" hover shaped class="partial-info">
          <PartitionDetail
            :partition="partition"
            :dynamic-partition-list="dynamicPartitions"
          />
        </v-card>
      </v-col>
    </v-row>
    <v-divider />
    <div v-if="!store.manifest?.nonAB && payloadHash">
      <h3>Payload SHA256 Hash</h3>
      <span class="hash-block">{{ payloadHash }}</span>
    </div>
    <v-divider />
    <div
      v-if="store.payload.metadata_signature && !store.manifest?.nonAB"
      class="signature"
    >
      <h3>Metadata Signature</h3>
      <span style="white-space: pre-wrap">
        {{ octToHex(store.payload.metadata_signature.signatures?.[0]?.data) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.signature {
  overflow: auto;
  max-height: 200px;
  width: 100%;
  word-break: break-all;
  text-align: left;
}

.hash-block {
  text-align: left;
  display: block;
  word-break: break-all;
}

.partial-info {
  padding: 5px;
}

.download-btn {
  margin-bottom: 16px;
}
</style>
