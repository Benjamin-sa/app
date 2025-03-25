<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PartBlock from '@/components/parts/PartBlock.vue';
import Motorcycle3DModel from '@/components/parts/Motorcycle3DModel.vue';

const router = useRouter();
const viewMode = ref('3d'); // Default to 3D view

// Parts data for the 2D view
const parts = [
    { id: 'wheels', name: 'Wheels', color: '#00642b' },
    { id: 'engine', name: 'Engine', color: '#004080' },
    { id: 'frame', name: 'Frame', color: '#8B0000' },
    { id: 'exhaust', name: 'Exhaust', color: '#707070' },
];

// Function to handle part selection from either 2D or 3D view
const handlePartSelected = (part) => {
    // Navigate to the specific part list
    router.push(`/products?category=${part.id}`);
};

// Toggle between 2D and 3D views
const toggleViewMode = () => {
    viewMode.value = viewMode.value === '2d' ? '3d' : '2d';
};

// Responsive sizing for the 3D model
const getModelDimensions = () => {
    const width = window.innerWidth < 768 ? window.innerWidth - 40 : 800;
    return {
        width: width,
        height: Math.min(600, width * 0.75) // Maintain aspect ratio
    };
};
const modelDimensions = ref(getModelDimensions());

// Update dimensions on window resize
window.addEventListener('resize', () => {
    modelDimensions.value = getModelDimensions();
});
</script>

<template>
    <div class="parts-viewer">
        <h1 class="text-3xl font-bold mb-4 text-center">Motorcycle Parts Viewer</h1>

        <p class="text-gray-600 mb-4 text-center">
            Click on any part to view related products
        </p>

        <!-- View mode toggle -->
        <div class="flex justify-center mb-6">
            <button @click="toggleViewMode" class="bg-[#00642b] text-white px-4 py-2 rounded-md hover:bg-opacity-80">
                Switch to {{ viewMode === '3d' ? '2D' : '3D' }} View
            </button>
        </div>

        <div class="interactive-area bg-gray-100 p-8 rounded-lg">
            <!-- 3D View -->
            <div v-if="viewMode === '3d'" class="flex justify-center">
                <Motorcycle3DModel :width="modelDimensions.width" :height="modelDimensions.height"
                    @part-selected="handlePartSelected" />
            </div>

            <!-- 2D View -->
            <div v-else class="flex flex-wrap justify-center gap-6">
                <PartBlock v-for="part in parts" :key="part.id" :partId="part.id" :partName="part.name"
                    :color="part.color" @part-selected="handlePartSelected" />
            </div>

            <div class="mt-8 text-center text-gray-500 text-sm">
                <p v-if="viewMode === '3d'">
                    Click and drag to rotate the model. Click on a part to view related products.
                </p>
                <p v-else>
                    This is a simple 2D representation. Switch to 3D view for a more interactive experience.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.parts-viewer {
    max-width: 1000px;
    margin: 0 auto;
}

.interactive-area {
    min-height: 400px;
}
</style>
