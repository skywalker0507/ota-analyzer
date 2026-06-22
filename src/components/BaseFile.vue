<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  'file-select': [file: File | URL]
}>()

const fileName = ref('')
const url = ref('')

const parsedURL = computed(() => {
  if (!url.value) {
    return null
  }
  try {
    return new URL(url.value)
  } catch {
    return null
  }
})

function handleFileChange(event: Event) {
  const target = event.currentTarget as HTMLInputElement
  if (!target.files?.length) {
    return
  }
  const selectedFile = target.files[0]
  emit('file-select', selectedFile)
  url.value = ''
  fileName.value = selectedFile.name
}

function dragover(event: DragEvent) {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.add('file-hover')
}

function dragleave(event: DragEvent) {
  const target = event.currentTarget as HTMLElement
  target.classList.remove('file-hover')
}

function drop(event: DragEvent) {
  event.preventDefault()
  const target = event.currentTarget as HTMLElement
  target.classList.remove('file-hover')
  if (!event.dataTransfer?.files.length) {
    return
  }
  const input = target.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
  if (input) {
    input.files = event.dataTransfer.files
    handleFileChange({ currentTarget: input } as unknown as Event)
  }
}

function urlKeyup(event: KeyboardEvent) {
  if (event.key !== 'Enter' || !parsedURL.value) {
    return
  }
  emit('file-select', parsedURL.value)
  fileName.value = parsedURL.value.href
}
</script>

<template>
  <div class="base-file">
    <label class="file-select">
      <div
        class="select-button"
        @dragover="dragover"
        @dragleave="dragleave"
        @drop="drop"
      >
        <span v-if="props.label">{{ !fileName ? props.label : '' }}</span>
        <span v-else>Select File</span>
        <div v-if="fileName">File selected: {{ fileName }}</div>
      </div>
      <input type="file" accept=".zip" @change="handleFileChange" />
    </label>
    <input
      v-model="url"
      class="url-input"
      :class="{
        'url-invalid': !parsedURL && url !== '',
        'url-valid': parsedURL || url === ''
      }"
      type="url"
      placeholder="type a URL"
      @keyup="urlKeyup"
    />
  </div>
</template>

<style scoped>
.base-file {
  width: 100%;
  max-width: 560px;
  margin: 0 auto 20px;
}

.file-select {
  display: block;
}

.file-select > .select-button {
  padding: 3rem;
  border-radius: 0.3rem;
  border: 4px dashed #eaebec;
  text-align: center;
  font-weight: bold;
  cursor: pointer;
}

.file-select > input[type='file'] {
  display: none;
}

.file-hover {
  background-color: #95e995;
}

.url-input {
  border-radius: 0.3rem;
  margin-top: 0.5rem;
  width: 100%;
}

.url-invalid {
  border: 3px solid red;
}

.url-valid {
  border: 3px dashed #6a9dd0;
}

.url-valid:focus {
  border: 3px solid #6a9dd0;
}
</style>
