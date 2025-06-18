<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <!-- Page Title Section (Non-sticky) -->
        <div
            class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border-b border-gray-200/50 dark:border-gray-700/50">
            <div class="container mx-auto px-4 py-6 sm:py-8">
                <div class="text-center space-y-4">
                    <!-- Page Header Slot -->
                    <slot name="page-header" />
                </div>
            </div>
        </div>

        <!-- Sticky Filters Section -->
        <div ref="filtersSection" :class="[
            'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky z-30 transition-all duration-300',
            isFiltersSticky ? 'top-0' : navbarStore.isVisible ? 'top-16' : 'top-0'
        ]">
            <div class="container mx-auto px-4 py-3 sm:py-4">
                <div class="flex flex-col space-y-3">
                    <!-- Sticky Header with Mobile Toggle -->
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div :class="filterIconClasses">
                                <AdjustmentsHorizontalIcon class="w-5 h-5" :class="filterIconColorClasses" />
                            </div>
                            <div>
                                <h3 class="font-semibold text-gray-900 dark:text-white">{{ filterTitle }}</h3>
                                <p class="text-sm text-gray-500 dark:text-gray-400">{{ filterSubtitle }}</p>
                            </div>
                        </div>

                        <!-- Mobile Filter Toggle -->
                        <button @click="showFilters = !showFilters"
                            class="sm:hidden flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
                            <ChevronDownIcon :class="['w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
                                showFilters ? 'rotate-180' : '']" />
                        </button>
                    </div>

                    <!-- Filter Controls -->
                    <div
                        :class="['transition-all duration-300 overflow-hidden',
                            showFilters || !isMobile ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 sm:max-h-96 sm:opacity-100']">
                        <slot name="filter-controls" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Area -->
        <div class="container mx-auto px-4 py-6 sm:py-8">
            <!-- Loading State -->
            <LoadingSection v-if="loading" :message="loadingMessage" />

            <!-- Empty State -->
            <div v-else-if="isEmpty" class="text-center py-16">
                <slot name="empty-state">
                    <div
                        class="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                        <component :is="emptyStateIcon" class="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{ emptyTitle }}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">{{ emptyDescription }}</p>
                    <slot name="empty-action" />
                </slot>
            </div>

            <!-- Grid Content -->
            <div v-else>
                <slot name="grid-content" />
            </div>

            <!-- Pagination or Load More -->
            <div v-if="!loading && !isEmpty" class="mt-8">
                <slot name="pagination" />
            </div>
        </div>

        <!-- Additional Content (modals, etc.) -->
        <slot name="additional" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNavbarStore } from '@/stores/navbar'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import { AdjustmentsHorizontalIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    loading: {
        type: Boolean,
        default: false
    },
    isEmpty: {
        type: Boolean,
        default: false
    },
    loadingMessage: {
        type: String,
        default: 'Loading...'
    },
    filterTitle: {
        type: String,
        default: 'Filters & Search'
    },
    filterSubtitle: {
        type: String,
        default: 'Find exactly what you\'re looking for'
    },
    filterIconClasses: {
        type: String,
        default: 'p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'
    },
    filterIconColorClasses: {
        type: String,
        default: 'text-blue-600 dark:text-blue-400'
    },
    emptyTitle: {
        type: String,
        default: 'No items found'
    },
    emptyDescription: {
        type: String,
        default: 'Try adjusting your search or filter criteria'
    },
    emptyStateIcon: {
        type: [String, Object],
        default: () => AdjustmentsHorizontalIcon
    }
})

const navbarStore = useNavbarStore()

// Mobile and filter state
const isMobile = computed(() => window.innerWidth < 640)
const showFilters = ref(false)
const filtersSection = ref(null)
const isFiltersSticky = ref(false)

// Sticky behavior for filters
const handleScroll = () => {
    if (filtersSection.value) {
        const rect = filtersSection.value.getBoundingClientRect()
        const navbarHeight = navbarStore.isVisible ? 64 : 0
        isFiltersSticky.value = rect.top <= navbarHeight
    }
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})
</script>
