<script setup lang="ts">
import { computed } from 'vue'
import { MetadataFormat, type Payload } from '@/services/payload'
import type { ZipFile } from '@/services/trim_zip'
import { formatBytes, toNumericSize } from '@/utils/format'

const props = defineProps<{
  zipFile: ZipFile
  payload: Payload
}>()

const otaMetadata = computed(() =>
  MetadataFormat.filter(formatter => String((props.payload as Record<string, unknown>)[formatter.key] ?? '').length > 0)
)

const isDataWipePackage = computed(() =>
  props.payload.payload_properties.includes('POWERWASH=1')
)

const totalCOWSize = computed(() => {
  const cowSizes =
    props.payload.manifest?.partitions.map(partition => toNumericSize(partition.estimateCowSize)) ?? []
  return cowSizes.reduce((sum, value) => sum + value, 0)
})

const vabcCompressionParam = computed(
  () => props.payload.manifest?.dynamicPartitionMetadata?.vabcCompressionParam || ''
)

const compressionFactor = computed(
  () => toNumericSize(props.payload.manifest?.dynamicPartitionMetadata?.compressionFactor)
)

const cowVersion = computed(
  () => toNumericSize(props.payload.manifest?.dynamicPartitionMetadata?.cowVersion)
)

const securityPatchLevel = computed(() => props.payload.manifest?.securityPatchLevel || '')

const totalDynamicPartitionSize = computed(() => {
  const groups = props.payload.manifest?.dynamicPartitionMetadata?.groups
  if (!groups) {
    return 0
  }
  const dynamicPartitionNames = new Set(groups.flatMap(group => group.partitionNames ?? []))
  const dynamicPartitions =
    props.payload.manifest?.partitions.filter(partition =>
      dynamicPartitionNames.has(partition.partitionName ?? '')
    ) ?? []
  return dynamicPartitions
    .map(partition => toNumericSize(partition.newPartitionInfo?.size))
    .reduce((sum, value) => sum + value, 0)
})
</script>

<template>
  <h3 class="section-title">Basic infos</h3>
  <ul class="info-list">
    <li>
      <span class="info-label">File name</span>
      <span class="info-value">{{ zipFile.getFileName() }}</span>
    </li>
    <li>
      <span class="info-label">File size</span>
      <span class="info-value">{{ formatBytes(zipFile.getFileSize()) }}</span>
    </li>
    <template v-if="payload.metadata">
      <li v-for="formatter in otaMetadata" :key="formatter.name">
        <span class="info-label">{{ formatter.name.trim() }}</span>
        <span class="info-value">{{ String((payload as Record<string, unknown>)[formatter.key]).trim() }}</span>
      </li>
    </template>
    <template v-if="payload.manifest">
      <li>
        <span class="info-label">Incremental</span>
        <span class="info-value">
          <span v-if="payload.preBuild">Yes</span>
          <span v-else>No</span>
        </span>
      </li>
      <li>
        <span class="info-label">Partial</span>
        <span class="info-value">{{ payload.manifest.partialUpdate ? 'Yes' : 'No' }}</span>
      </li>
      <li>
        <span class="info-label">A/B update</span>
        <span class="info-value">{{ !payload.manifest.nonAB ? 'Yes' : 'No' }}</span>
      </li>
      <li v-if="payload.manifest.dynamicPartitionMetadata">
        <span class="info-label">VAB</span>
        <span class="info-value">
          {{ payload.manifest.dynamicPartitionMetadata.snapshotEnabled ? 'Yes' : 'No' }}
        </span>
      </li>
      <li v-if="payload.manifest.dynamicPartitionMetadata">
        <span class="info-label">VABC</span>
        <span class="info-value">
          {{ payload.manifest.dynamicPartitionMetadata.vabcEnabled ? 'Yes' : 'No' }}
        </span>
      </li>
      <li>
        <span class="info-label">Wipes Data</span>
        <span class="info-value">{{ isDataWipePackage ? 'Yes' : 'No' }}</span>
      </li>
      <li v-if="totalDynamicPartitionSize">
        <span class="info-label">Total Dynamic Partition Size</span>
        <span class="info-value">{{ formatBytes(totalDynamicPartitionSize) }}</span>
      </li>
      <li v-if="totalCOWSize">
        <span class="info-label">Total VABC COW Size</span>
        <span class="info-value">{{ formatBytes(totalCOWSize) }}</span>
      </li>
      <li v-if="vabcCompressionParam">
        <span class="info-label">VABC Compression Algorithm</span>
        <span class="info-value">{{ vabcCompressionParam }}</span>
      </li>
      <li v-if="compressionFactor">
        <span class="info-label">Compression Factor</span>
        <span class="info-value">{{ compressionFactor }}</span>
      </li>
      <li v-if="cowVersion">
        <span class="info-label">Cow Version</span>
        <span class="info-value">{{ cowVersion }}</span>
      </li>
      <li v-if="securityPatchLevel">
        <span class="info-label">Security Patch Level</span>
        <span class="info-value">{{ securityPatchLevel }}</span>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.section-title {
  text-align: left;
  margin-bottom: 12px;
}

.info-list {
  margin: 0;
  padding: 0;
  text-align: left;
}

.info-list li {
  list-style: none;
  display: grid;
  grid-template-columns: minmax(180px, 240px) 1fr;
  gap: 8px 16px;
  align-items: start;
  margin-bottom: 10px;
}

.info-label {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
}

.info-label::after {
  content: ':';
}

.info-value {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
