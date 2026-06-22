<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PartialCheckbox from './PartialCheckbox.vue'
import PieChart from './PieChart.vue'
import BaseFile from './BaseFile.vue'
import { useOtaStore } from '@/stores/ota'
import {
  downloadFile,
  ensureSuffix,
  getFileName,
  trimTargetFiles
} from '@/services/trim_zip'

const props = defineProps<{
  demo?: boolean
}>()

const store = useOtaStore()
const { echartsData, filenameListData, filteredFilenameList } = storeToRefs(store)
const downloadNode = ref<HTMLAnchorElement | null>(null)

const cowMergeDisabled = computed(
  () =>
    !!store.manifest?.nonAB ||
    !store.manifest?.dynamicPartitionMetadata ||
    !store.manifest.dynamicPartitionMetadata.vabcEnabled
)

onMounted(async () => {
  if (!props.demo) {
    return
  }
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}files/cf_x86_target_file_demo.zip`)
    if (!response.ok) {
      throw new Error('Demo target file not found')
    }
    const blob = await response.blob()
    store.setTargetFile(new File([blob], 'target_demo.zip'))
  } catch (err) {
    console.warn('Please put a proper example target file in /public/files/', err)
  }
})

async function exportTargetFileMetadata() {
  if (!store.targetFile || !downloadNode.value) {
    return
  }
  const blob = await trimTargetFiles(store.targetFile)
  downloadFile(
    blob,
    downloadNode.value,
    'trimmed_' + ensureSuffix(getFileName(store.targetFile), '.zip')
  )
}
</script>

<template>
  <v-btn
    v-if="store.targetFile"
    block
    class="mb-4"
    :loading="store.loading"
    @click="exportTargetFileMetadata"
  >
    Export Target File Metadata
  </v-btn>
  <a ref="downloadNode" />

  <v-alert
    v-if="store.postBuildFingerprint"
    type="info"
    variant="tonal"
    class="mb-4"
    density="compact"
  >
    OTA post-build fingerprint: {{ store.postBuildFingerprint }}
  </v-alert>

  <PartialCheckbox v-if="store.updatePartitions.length" :labels="store.updatePartitions" />

  <v-progress-linear
    v-if="store.loading"
    indeterminate
    color="primary"
    class="mb-4"
  />
  <div v-if="store.loadingMessage" class="mb-4">{{ store.loadingMessage }}</div>

  <div v-if="echartsData">
    <PieChart :echarts-data="echartsData" />
  </div>

  <div v-if="filenameListData.length" class="filename-list">
    <div class="filename-toolbar">
      <div>
        <h3 class="section-title">Analysed Filenames</h3>
        <p class="filename-summary">
          Showing {{ filteredFilenameList.length }} of
          {{ filenameListData.length }} entries. Export CSV for the full list.
        </p>
      </div>
      <div class="toolbar-actions">
        <v-text-field
          v-model="store.filenameFilter"
          density="compact"
          hide-details
          label="Search filename"
          prepend-inner-icon="mdi-magnify"
          class="search-field"
        />
        <v-btn size="small" variant="outlined" @click="store.exportFilenameCsv">
          Export CSV
        </v-btn>
      </div>
    </div>
    <div class="filename-table-wrap">
      <table>
        <thead>
          <tr>
            <th>File name</th>
            <th>Size</th>
            <th>Bytes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in filteredFilenameList" :key="entry.filename">
            <td class="filename-cell" :title="entry.filename">
              {{ entry.filename }}
            </td>
            <td>{{ entry.formattedSize }}</td>
            <td>{{ entry.size }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!filteredFilenameList.length" class="empty-hint">
      No filenames match the current filter.
    </p>
  </div>

  <v-divider class="my-4" />

  <div class="analyse-actions">
    <v-btn
      class="analyse-btn"
      block
      :loading="store.loading"
      @click="store.analyze('blocks')"
    >
      Analyse Installed Blocks (in target build)
    </v-btn>
    <v-btn
      class="analyse-btn"
      block
      :loading="store.loading"
      @click="store.analyze('payload')"
    >
      Analyse Payload Composition
    </v-btn>
    <v-btn
      class="analyse-btn"
      block
      :loading="store.loading"
      @click="store.analyze('partitions')"
    >
      Analyse Partition Payload Composition
    </v-btn>
    <div class="tooltip analyse-btn">
      <v-btn
        block
        :disabled="cowMergeDisabled"
        :loading="store.loading"
        title="Only available for VABC update"
        @click="store.analyze('COWmerge')"
      >
        Analyse COW Merge Operations
      </v-btn>
      <span v-if="store.manifest?.nonAB" class="tooltiptext">
        This function is only supported in A/B OTA
      </span>
    </div>
    <v-btn
      class="analyse-btn"
      block
      :disabled="!store.targetFile"
      :loading="store.loading"
      @click="store.analyze('filenames')"
    >
      Analyse Filenames
    </v-btn>
    <v-btn
      class="analyse-btn"
      block
      :disabled="!store.targetFile"
      :loading="store.loading"
      @click="store.analyze('extensions')"
    >
      Analyse File Extensions
    </v-btn>
  </div>

  <div v-if="!props.demo" class="target-file-upload">
    <v-alert type="info" variant="tonal" density="compact" class="mb-3">
      <div class="target-file-hint">
        <p>
          <strong>Target build（目标版本）</strong>：请上传与 OTA
          <code>post-build</code> 一致的产物，用于「Analyse Filenames /
          Analyse File Extensions」。基础版本（pre-build）的 target-files 不适用。
        </p>
        <p>
          支持两种 zip 包，工具会读取其中的 <code>.map</code> 做块地址到文件名的映射：
        </p>
        <ul>
          <li>target-files：<code>IMAGES/&lt;partition&gt;.map</code></li>
          <li>刷机包：<code>&lt;partition&gt;.map</code>（zip 根目录）</li>
        </ul>
        <p v-if="store.postBuildFingerprint" class="fingerprint-hint">
          请确认与上方 OTA post-build fingerprint 一致。
        </p>
      </div>
    </v-alert>
    <BaseFile
      label="上传 target-files 或刷机包（含 .map）"
      @file-select="store.setTargetFile"
    />
  </div>
</template>

<style scoped>
.section-title {
  margin: 0;
  text-align: left;
}

.filename-list {
  margin: 16px 0;
}

.filename-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.filename-summary {
  margin: 4px 0 0;
  opacity: 0.75;
  font-size: 0.875rem;
}

.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-field {
  min-width: 240px;
  max-width: 360px;
}

.filename-table-wrap {
  max-height: 360px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}

.filename-list table {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}

.filename-list thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
}

.filename-list th:first-child {
  width: 70%;
}

.filename-list th:nth-child(2),
.filename-list th:nth-child(3) {
  width: 15%;
}

.filename-list th,
.filename-list td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding: 8px;
  text-align: left;
}

.filename-cell {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.filename-list td:nth-child(2),
.filename-list td:nth-child(3) {
  white-space: nowrap;
}

.empty-hint {
  margin-top: 8px;
  opacity: 0.7;
}

.analyse-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.analyse-btn {
  min-width: 0;
}

.analyse-actions :deep(.v-btn) {
  height: auto;
  min-height: 36px;
  padding-top: 8px;
  padding-bottom: 8px;
  white-space: normal;
}

.target-file-hint {
  font-size: 0.875rem;
  line-height: 1.5;
}

.target-file-hint p {
  margin: 0 0 8px;
}

.target-file-hint p:last-child {
  margin-bottom: 0;
}

.target-file-hint ul {
  margin: 0 0 8px;
  padding-left: 1.25rem;
}

.target-file-hint code {
  font-size: 0.8125rem;
}

.fingerprint-hint {
  opacity: 0.9;
}

.target-file-upload {
  width: 100%;
  margin: 20px auto 0;
}

.target-file-upload :deep(.base-file) {
  margin-bottom: 0;
}

@media (max-width: 960px) {
  .analyse-actions {
    grid-template-columns: 1fr;
  }
}

.tooltip {
  position: relative;
  min-width: 0;
}

.tooltip .tooltiptext {
  visibility: hidden;
  width: 120px;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
}

.tooltip:hover .tooltiptext {
  visibility: visible;
}
</style>
