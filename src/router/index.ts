import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Analysis',
      component: () => import('@/views/PackageAnalysis.vue'),
      meta: { title: 'Analyse OTA package - from AOSP' }
    },
    {
      path: '/demo',
      name: 'Demo',
      component: () => import('@/views/Demo.vue')
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/About.vue')
    },
    {
      path: '/:catchAll(.*)',
      name: 'Not Found',
      component: () => import('@/views/NotFound.vue')
    }
  ]
})

router.beforeEach(to => {
  const nearestWithTitle = to.matched
    .slice()
    .reverse()
    .find(route => route.meta?.title)

  if (nearestWithTitle?.meta?.title) {
    document.title = nearestWithTitle.meta.title as string
  }
})

export default router
