<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="ime === 'zatvori'"><path d="M6 6l12 12M18 6L6 18" /></template>
    <template v-else-if="ime === 'lijevo'"><path d="M15 5l-7 7 7 7" /></template>
    <template v-else-if="ime === 'desno'"><path d="M9 5l7 7-7 7" /></template>
    <template v-else-if="ime === 'srce'"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z" /></template>
    <template v-else-if="ime === 'srce-puno'"><path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.6c0 5.7-7.5 10.3-7.5 10.3z" fill="currentColor" /></template>
    <template v-else-if="ime === 'preuzmi'"><path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" /></template>
    <template v-else-if="ime === 'dijeli'"><path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M6 12v7.5h12V12" /></template>
    <template v-else-if="ime === 'kvacica'"><path d="M5 12.5l4.5 4.5L19 7.5" /></template>
    <template v-else-if="ime === 'kvacica-krug'"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></template>
    <template v-else-if="ime === 'krug'"><circle cx="12" cy="12" r="9" /></template>
    <template v-else-if="ime === 'lokot'"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></template>
    <template v-else-if="ime === 'strelica-dolje'"><path d="M6 9.5l6 6 6-6" /></template>
    <template v-else-if="ime === 'instagram'"><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" /></template>
    <template v-else-if="ime === 'zoom'"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" /></template>
  </svg>
</template>

<script setup>
defineProps({ ime: { type: String, required: true } });
</script>
