<template>
  <div class="countdown" :class="{ 'is-ended': isEnd }">
    <template v-if="!isEnd">
      <div class="unit">
        <span class="num">{{ pad(timeData.hours) }}</span>
        <span class="label">HRS</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="num">{{ pad(timeData.minutes) }}</span>
        <span class="label">MIN</span>
      </div>
      <span class="sep">:</span>
      <div class="unit">
        <span class="num">{{ pad(timeData.seconds) }}</span>
        <span class="label">SEC</span>
      </div>
    </template>
    <span v-else class="ended-text">已开始</span>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  targetTime: { type: String, default: '' }
})

const emit = defineEmits(['end'])

const now = ref(Date.now())
let timer = null

const timeData = computed(() => {
  const diff = Math.max(0, new Date(props.targetTime).getTime() - now.value)
  const totalSeconds = Math.floor(diff / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60
  }
})

const isEnd = computed(() => {
  return now.value >= new Date(props.targetTime).getTime()
})

function pad(n) {
  return String(n).padStart(2, '0')
}

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
    if (now.value >= new Date(props.targetTime).getTime()) {
      clearInterval(timer)
      emit('end')
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.countdown {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
}

.unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.num {
  display: inline-block;
  min-width: 52px;
  padding: 9px 8px;
  border-radius: var(--r-lg);
  background: var(--canvas-night-elevated);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 330;
  font-variation-settings: "wght" 330;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  box-shadow: var(--elev-1), 0 0 0 1px rgba(255, 255, 255, .08);
}

.label {
  font-size: 9px;
  letter-spacing: 2.4px;
  color: var(--shade-50);
  text-transform: uppercase;
}

.sep {
  color: var(--shade-60);
  font-weight: 300;
  font-size: 22px;
  line-height: 1;
  margin-top: 11px;
}

.ended-text {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  border-radius: var(--r-pill);
  background: transparent;
  color: #ffffff;
  font-size: 14px;
  font-weight: 550;
  letter-spacing: .5px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28);
}
</style>
