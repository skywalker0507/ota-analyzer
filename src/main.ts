import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { configure } from '@zip.js/zip.js'

configure({ useWebWorkers: false })

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app')
