<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { numBlocks, displayBlocks } from '@/services/payload_composition'
import { OpType, octToHex } from '@/services/payload'
import { formatBytes } from '@/utils/format'
import type { chromeos_update_engine } from '@/services/update_metadata_pb'

const props = defineProps<{
  operation: chromeos_update_engine.IInstallOperation
  mapType: OpType['mapType']
}>()

const opTypeName = computed(() => props.mapType.getWithDefault(props.operation.type))
const srcTotalBlocks = ref(0)
const srcBlocks = ref('')
const dstTotalBlocks = ref(0)
const dstBlocks = ref('')

onMounted(() => {
  if (props.operation.srcExtents) {
    srcTotalBlocks.value = numBlocks(props.operation.srcExtents)
    srcBlocks.value = displayBlocks(props.operation.srcExtents as chromeos_update_engine.Extent[])
  }
  if (props.operation.dstExtents) {
    dstTotalBlocks.value = numBlocks(props.operation.dstExtents)
    dstBlocks.value = displayBlocks(props.operation.dstExtents as chromeos_update_engine.Extent[])
  }
})
</script>

<template>
  <ul>
    <h5>{{ opTypeName }}</h5>
    <li v-if="Object.prototype.hasOwnProperty.call(operation, 'dataOffset')">
      <strong>Data offset:</strong> {{ operation.dataOffset }}
    </li>
    <li v-if="Object.prototype.hasOwnProperty.call(operation, 'dataLength')">
      <strong>Data length:</strong> {{ operation.dataLength }}
    </li>
    <li v-if="operation.srcExtents">
      <strong>Source:</strong> {{ operation.srcExtents.length }} extents ({{ srcTotalBlocks }} blocks)
      <br />
      {{ srcBlocks }}
    </li>
    <li v-if="operation.dstExtents">
      <strong>Destination:</strong> {{ operation.dstExtents.length }} extents ({{ dstTotalBlocks }} blocks)
      <br />
      {{ dstBlocks }}
    </li>
  </ul>
  <v-divider />
</template>

<style scoped>
ul {
  padding: 5px;
}

li {
  list-style-type: none;
}
</style>
