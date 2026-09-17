import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const userId = ref(localStorage.getItem('userId') || '10001')
  const activities = ref([])

  function setUserId(id) {
    userId.value = id
    localStorage.setItem('userId', id)
  }

  return { userId, activities, setUserId }
})
