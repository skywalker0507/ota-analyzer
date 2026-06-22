<script setup lang="ts">
import { computed, ref } from 'vue'
import OperationDetail from './OperationDetail.vue'
import { OpType, octToHex } from '@/services/payload'
import { formatBytes, toNumericSize } from '@/utils/format'
import type { chromeos_update_engine } from '@/services/update_metadata_pb'

const props = defineProps<{
  partition: chromeos_update_engine.IPartitionUpdate
  dynamicPartitionList: string[]
}>()

const showOps = ref(false)
const showInfo = ref(false)
const opType = new OpType()

const readableTimestamp = computed(() => {
  const unixTimestamp = parseInt(props.partition.version ?? '', 10)
  if (Number.isNaN(unixTimestamp)) {
    return ''
  }
  return new Date(unixTimestamp * 1000).toString()
})

const isDynamicPartition = computed(
  () => props.dynamicPartitionList.includes(props.partition.partitionName ?? '')
)

const isFECEnabled = computed(() => (props.partition.fecExtent?.numBlocks ?? 0) > 0)
const isHashtreeEnabled = computed(() => (props.partition.hashTreeExtent?.numBlocks ?? 0) > 0)
</script>

<template>
  <h4 :class="{ 'new-partition': !partition.oldPartitionInfo }">
    {{ partition.partitionName }}
  </h4>
  <pre v-if="isDynamicPartition" class="partition-flag">Dynamic:  ✅</pre>
  <pre v-if="isFECEnabled" class="partition-flag">FEC:      ✅</pre>
  <pre v-if="isHashtreeEnabled" class="partition-flag">Hashtree: ✅</pre>
  <p v-if="partition.estimateCowSize">
    <strong>Estimate COW Size:</strong> {{ formatBytes(toNumericSize(partition.estimateCowSize)) }}
  </p>
  <p v-if="partition.postinstallPath">
    <strong>Postinstall Script:</strong> {{ partition.postinstallPath }}
  </p>
  <div class="toggle">
    <h4
      :class="{ active: showInfo, inactive: !showInfo }"
      @click="showInfo = !showInfo"
    >
      Partition Infos
    </h4>
    <ul v-if="showInfo">
      <li v-if="partition.oldPartitionInfo">
        <strong>Old Partition Size:</strong>
        {{ formatBytes(toNumericSize(partition.oldPartitionInfo.size)) }}
      </li>
      <li v-if="partition.oldPartitionInfo?.hash">
        <strong>Old Partition Hash:</strong>
        <div class="hex">{{ octToHex(partition.oldPartitionInfo.hash, false, 16) }}</div>
      </li>
      <li>
        <strong>New Partition Size:</strong>
        {{ formatBytes(toNumericSize(partition.newPartitionInfo?.size)) }}
      </li>
      <li v-if="partition.newPartitionInfo?.hash">
        <strong>New Partition Hash:</strong>
        <div class="hex">{{ octToHex(partition.newPartitionInfo.hash, false, 16) }}</div>
      </li>
      <li v-if="partition.version">
        <strong>Version:</strong> {{ partition.version }}
      </li>
      <li v-if="readableTimestamp">
        <strong>Timestamp:</strong> {{ readableTimestamp }}
      </li>
    </ul>
  </div>
  <div class="toggle">
    <h4
      :class="{ active: showOps, inactive: !showOps }"
      @click="showOps = !showOps"
    >
      Total Operations: {{ partition.operations?.length ?? 0 }}
    </h4>
    <ul v-if="showOps">
      <li
        v-for="(operation, index) in partition.operations"
        :key="`${operation.dataOffset}-${operation.dataLength}-${index}`"
      >
        <OperationDetail :operation="operation" :map-type="opType.mapType" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.toggle {
  display: block;
  cursor: pointer;
}

li {
  list-style-type: none;
}

.hex {
  word-break: break-all;
}

.inactive::after {
  content: ' ▶️';
}

.active {
  color: rgb(var(--v-theme-secondary-darken-1));
}

.active::after {
  content: ' 🔽';
}

.new-partition {
  color: rgb(var(--v-theme-success));
}

.partition-flag {
  margin: 0 0 8px;
}
</style>
