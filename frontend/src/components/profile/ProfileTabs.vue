<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                    'py-4 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]">
                    {{ tab.name }}
                    <span v-if="tab.count !== undefined" :class="[
                        'ml-2 py-0.5 px-2 rounded-full text-xs',
                        activeTab === tab.id
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-900'
                    ]">
                        {{ tab.count }}
                    </span>
                </button>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
            <slot :activeTab="activeTab" :userProfile="userProfile" :userTopics="userTopics" :userAnswers="userAnswers"
                :userProducts="userProducts">
            </slot>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    userProfile: {
        type: Object,
        required: true
    },
    userTopics: {
        type: Array,
        default: () => []
    },
    userAnswers: {
        type: Array,
        default: () => []
    },
    userProducts: {
        type: Array,
        default: () => []
    }
})

const activeTab = ref('topics')

const tabs = computed(() => [
    {
        id: 'topics',
        name: 'Topics',
        count: props.userProfile?.topics_created || 0
    },
    {
        id: 'answers',
        name: 'Answers',
        count: props.userProfile?.answers_posted || 0
    },
    {
        id: 'products',
        name: 'Products',
        count: props.userProfile?.products_count || 0
    },
    {
        id: 'about',
        name: 'About'
    }
])

defineExpose({ activeTab })
</script>
