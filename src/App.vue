<script setup lang="ts">
const links = ['Analysis', 'Demo', 'About'] as const
</script>

<template>
  <v-app>
    <v-app-bar rounded color="primary">
      <v-app-bar-title>OTA Analyzer</v-app-bar-title>
      <v-spacer />
      <v-btn
        v-for="link in links"
        :key="link"
        :to="{ name: link }"
        class="ml-5"
        color="primary"
        variant="text"
      >
        {{ link }}
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
h3 {
  text-align: left;
}
</style>
