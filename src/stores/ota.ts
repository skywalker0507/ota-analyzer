import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Payload } from '@/services/payload'
import { ZipFile } from '@/services/trim_zip'
import { EchartsData } from '@/services/echarts_data'
import { analysePartitions } from '@/services/payload_composition'
import { formatBytes, toNumericSize } from '@/utils/format'

export interface FilenameListEntry {
  filename: string
  size: number
  formattedSize: string
}

export const useOtaStore = defineStore('ota', () => {
  const zipFile = ref<ZipFile | null>(null)
  const payload = ref<Payload | null>(null)
  const targetFile = ref<File | URL | null>(null)
  const loading = ref(false)
  const loadingMessage = ref('')
  const error = ref<string | null>(null)
  const partitionInclude = ref(new Map<string, boolean>())
  const echartsData = ref<EchartsData | null>(null)
  const activeAnalysis = ref('')
  const filenameListData = ref<FilenameListEntry[]>([])
  const filenameFilter = ref('')

  const manifest = computed(() => payload.value?.manifest ?? null)
  const updatePartitions = computed(
    () => manifest.value?.partitions.map(p => p.partitionName ?? '') ?? []
  )
  const filteredFilenameList = computed(() => {
    const query = filenameFilter.value.trim().toLowerCase()
    if (!query) {
      return filenameListData.value
    }
    return filenameListData.value.filter(entry =>
      entry.filename.toLowerCase().includes(query)
    )
  })
  const postBuildFingerprint = computed(() => payload.value?.postBuild ?? '')

  function clearError() {
    error.value = null
  }

  function ensurePartitionSelection(labels: string[]) {
    const next = new Map(partitionInclude.value)
    labels.forEach(label => {
      if (!next.has(label)) {
        next.set(label, true)
      }
    })
    partitionInclude.value = next
  }

  function initPartitionSelection() {
    const next = new Map<string, boolean>()
    manifest.value?.partitions.forEach(partition => {
      if (partition.partitionName) {
        next.set(partition.partitionName, true)
      }
    })
    partitionInclude.value = next
  }

  function resetAnalysisResults() {
    echartsData.value = null
    activeAnalysis.value = ''
    filenameListData.value = []
    filenameFilter.value = ''
  }

  async function unpackOTA(file: File | URL) {
    loading.value = true
    loadingMessage.value = 'Parsing OTA package...'
    error.value = null
    resetAnalysisResults()
    zipFile.value = null
    payload.value = null

    try {
      const nextZipFile = new ZipFile(file)
      const nextPayload = new Payload(nextZipFile)
      await nextPayload.init()
      zipFile.value = nextZipFile
      payload.value = nextPayload
      initPartitionSelection()
    } catch (err) {
      error.value = `Please check if this is a correct OTA package (.zip). ${err}`
    } finally {
      loading.value = false
      loadingMessage.value = ''
    }
  }

  function setTargetFile(file: File | URL) {
    targetFile.value = file
    clearError()
  }

  function togglePartition(name: string) {
    const next = new Map(partitionInclude.value)
    next.set(name, !next.get(name))
    partitionInclude.value = next
  }

  function setAllPartitions(selected: boolean) {
    const next = new Map<string, boolean>()
    partitionInclude.value.forEach((_value, key) => {
      next.set(key, selected)
    })
    partitionInclude.value = next
  }

  async function analyze(metrics: string) {
    if (!manifest.value) {
      return
    }

    const partitionSelected = manifest.value.partitions.filter(partition =>
      partitionInclude.value.get(partition.partitionName ?? '')
    )

    if (partitionSelected.length === 0) {
      error.value = 'Please select at least one partition to analyse.'
      return
    }

    loading.value = true
    loadingMessage.value = `Analyzing ${metrics}...`
    error.value = null
    filenameListData.value = []
    filenameFilter.value = ''

    try {
      const result = await analysePartitions(
        metrics,
        partitionSelected,
        toNumericSize(manifest.value.blockSize) || 4096,
        targetFile.value
      )
      echartsData.value = result
      activeAnalysis.value = metrics

      if (metrics === 'filenames' && echartsData.value) {
        filenameListData.value = Array.from(
          echartsData.value.statisticData.entries()
        )
          .sort((first, second) => second[1] - first[1])
          .map(([filename, size]) => ({
            filename,
            size,
            formattedSize: formatBytes(size)
          }))
      }
    } catch (err) {
      error.value = `Cannot be processed for the following issue: ${err}`
      echartsData.value = null
      activeAnalysis.value = ''
    } finally {
      loading.value = false
      loadingMessage.value = ''
    }
  }

  function exportFilenameCsv() {
    const rows = [
      ['filename', 'size_bytes', 'formatted_size'],
      ...filenameListData.value.map(entry => [
        entry.filename,
        String(entry.size),
        entry.formattedSize
      ])
    ]
    const csv = rows
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'analysed_filenames.csv'
    anchor.click()
    window.URL.revokeObjectURL(url)
  }

  return {
    zipFile,
    payload,
    targetFile,
    loading,
    loadingMessage,
    error,
    partitionInclude,
    echartsData,
    activeAnalysis,
    filenameListData,
    filenameFilter,
    manifest,
    updatePartitions,
    filteredFilenameList,
    postBuildFingerprint,
    clearError,
    unpackOTA,
    setTargetFile,
    togglePartition,
    setAllPartitions,
    analyze,
    exportFilenameCsv,
    ensurePartitionSelection
  }
})
