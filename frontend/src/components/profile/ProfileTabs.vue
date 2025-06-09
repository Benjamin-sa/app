<template>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
                <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="[
                    'py-4 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                        ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                ]">
                    {{ tab.name }}
                    <span v-if="tab.count !== undefined" :class="[
                        'ml-2 py-0.5 px-2 rounded-full text-xs',
                        activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-300'
                    ]">
                        {{ tab.count }}
                    </span>
                </button>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
            <slot :activeTab="activeTab" :userProfile="userProfile" :userTopics="userTopics" :userAnswers="userAnswers"
                :userBikes="userBikes" :userProducts="userProducts">
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
    userBikes: {
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
        id: 'bikes',
        name: 'Bikes',
        count: props.userBikes?.length || 0
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
