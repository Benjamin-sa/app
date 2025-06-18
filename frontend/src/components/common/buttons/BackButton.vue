<template>
    <div class="mb-6">
        <ActionButton type="button" @click="handleBack" variant="secondary" size="sm"
            class="flex items-center space-x-2">
            <ArrowLeftIcon class="w-4 h-4" />
            <span>{{ label }}</span>
        </ActionButton>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    label: {
        type: String,
        default: 'Back'
    },
    fallbackPath: {
        type: String,
        default: null
    }
})

const router = useRouter()

const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
        router.back()
    } else if (props.fallbackPath) {
        // If no history, use fallback path
        router.push(props.fallbackPath)
    } else {
        // Default fallback to home
        router.push('/')
    }
}
</script>
