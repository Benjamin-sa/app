<template>
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
        :style="{ paddingTop: `${navbarStore.navbarHeight}px` }">

        <!-- Loading State -->
        <LoadingSection v-if="loading" :message="loadingMessage" />

        <!-- Error State -->
        <ErrorSection v-else-if="error" :error="error" @retry="$emit('retry')" />

        <!-- Content -->
        <div v-else-if="item" class="container mx-auto px-4 py-6 sm:py-8">
            <!-- Before Content Slot -->
            <slot name="before-content"></slot>

            <!-- Breadcrumb -->
            <BreadcrumbNav :items="breadcrumbItems" class="mb-6" />

            <!-- Main Content Slot -->
            <slot name="content" :item="item" />

            <!-- Related Items -->
            <RelatedItemsSection v-if="relatedItems.length > 0" :title="relatedTitle" :items="relatedItems"
                :view-all-link="viewAllLink" class="mt-12">
                <template #item="{ item }">
                    <slot name="related-item" :item="item" />
                </template>
            </RelatedItemsSection>
        </div>

        <!-- Not Found State -->
        <NotFoundSection v-else :title="notFoundTitle" :description="notFoundDescription" :link="viewAllLink" />
    </div>
</template>

<script setup>
import { useNavbarStore } from '@/stores/ui/navbar'
import LoadingSection from '@/components/common/sections/LoadingSection.vue'
import ErrorSection from '@/components/common/sections/ErrorSection.vue'
import BreadcrumbNav from '@/components/common/nav/BreadcrumbNav.vue'
import RelatedItemsSection from '@/components/common/sections/RelatedItemsSection.vue'
import NotFoundSection from '@/components/common/sections/NotFoundSection.vue'

defineProps({
    loading: Boolean,
    error: String,
    item: Object,
    loadingMessage: {
        type: String,
        default: 'Loading details...'
    },
    breadcrumbItems: {
        type: Array,
        default: () => []
    },
    relatedItems: {
        type: Array,
        default: () => []
    },
    relatedTitle: String,
    viewAllLink: String,
    notFoundTitle: {
        type: String,
        default: 'Item Not Found'
    },
    notFoundDescription: {
        type: String,
        default: 'The item you\'re looking for doesn\'t exist or has been removed.'
    }
})

defineEmits(['retry'])

const navbarStore = useNavbarStore()
</script>
