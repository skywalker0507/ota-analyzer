<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useOtaStore } from '@/stores/ota'

const props = defineProps<{
  labels: string[]
}>()

const store = useOtaStore()

function syncLabels(labels: string[]) {
  store.ensurePartitionSelection(labels)
}

onMounted(() => syncLabels(props.labels))
watch(() => props.labels, syncLabels)
</script>

<template>
  <v-btn block type="button" class="my-5" @click="store.setAllPartitions(true)">
    Select All
  </v-btn>
  <v-btn block type="button" class="mb-5" @click="store.setAllPartitions(false)">
    Unselect All
  </v-btn>
  <v-row class="mb-5 partition-grid">
    <v-col v-for="label in labels" :key="label" cols="6" sm="4" md="3">
      <input
        type="checkbox"
        :checked="store.partitionInclude.get(label)"
        @change="store.togglePartition(label)"
      />
      <label>{{ label }}</label>
    </v-col>
  </v-row>
</template>

<style scoped>
label {
  margin-left: 8px;
}

.partition-grid {
  margin-top: 0;
}
</style>
