<template>
    <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Background overlay -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
                @click="$emit('close')"></div>

            <!-- Modal panel -->
            <div
                class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        {{ editingBike ? 'Edit Bike' : 'Add New Bike' }}
                    </h3>

                    <form @submit.prevent="handleSubmit" class="space-y-6">
                        <!-- Basic Info -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="name"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Bike Name *
                                </label>
                                <input id="name" v-model="form.name" type="text" required
                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="My Awesome Brommer" />
                            </div>

                            <div>
                                <label for="brand"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Brand
                                </label>
                                <input id="brand" v-model="form.brand" type="text"
                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Honda, Yamaha, etc." />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="model"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Model
                                </label>
                                <input id="model" v-model="form.model" type="text"
                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="CB125, YBR125, etc." />
                            </div>

                            <div>
                                <label for="year"
                                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Year
                                </label>
                                <input id="year" v-model="form.year" type="number" min="1950"
                                    :max="new Date().getFullYear() + 1"
                                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
                            </div>
                        </div>

                        <div>
                            <label for="engine_size"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Engine Size (cc)
                            </label>
                            <input id="engine_size" v-model="form.engine_size" type="number" min="50" max="1000"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="125" />
                        </div>

                        <!-- Description -->
                        <div>
                            <label for="description"
                                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea id="description" v-model="form.description" rows="3"
                                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Tell us about your bike, modifications, etc." />
                        </div>

                        <!-- Photo Upload -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Photos
                            </label>
                            <div class="space-y-4">
                                <!-- Upload Area -->
                                <div
                                    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                    <input ref="fileInput" type="file" multiple accept="image/*"
                                        @change="handleFilesSelect" class="hidden" />
                                    <CameraIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p class="text-gray-600 dark:text-gray-400 mb-2">
                                        Drop photos here or click to browse
                                    </p>
                                    <Button type="button" variant="secondary" @click="$refs.fileInput.click()">
                                        Choose Photos
                                    </Button>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Max 10 photos, 5MB each
                                    </p>
                                </div>

                                <!-- Preview Existing Photos -->
                                <div v-if="existingPhotos.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div v-for="(photo, index) in existingPhotos" :key="photo.id || index"
                                        class="relative group">
                                        <img :src="photo.url || photo" :alt="`Bike photo ${index + 1}`"
                                            class="w-full h-24 object-cover rounded-lg" />
                                        <button type="button" @click="removeExistingPhoto(index)"
                                            class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XMarkIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <!-- Preview New Photos -->
                                <div v-if="previewUrls.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div v-for="(url, index) in previewUrls" :key="index" class="relative group">
                                        <img :src="url" :alt="`New photo ${index + 1}`"
                                            class="w-full h-24 object-cover rounded-lg" />
                                        <button type="button" @click="removeNewPhoto(index)"
                                            class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XMarkIcon class="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <ErrorMessage v-if="error" :message="error" />

                        <!-- Actions -->
                        <div class="flex justify-end space-x-3 pt-6">
                            <Button type="button" variant="secondary" @click="$emit('close')" :disabled="loading">
                                Cancel
                            </Button>
                            <Button type="submit" :loading="loading" :disabled="!form.name || loading">
                                {{ editingBike ? 'Update Bike' : 'Add Bike' }}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useApi } from '@/composables/useApi'
import { validateImageFile, createImagePreview } from '@/utils/helpers'
import { apiService } from '@/services/api.service'
import Button from '@/components/common/Button.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { CameraIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
    open: {
        type: Boolean,
        required: true
    },
    bike: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['close', 'saved'])

const notificationStore = useNotificationStore()
const { loading, error, execute } = useApi()

const editingBike = ref(false)
const form = ref({
    name: '',
    brand: '',
    model: '',
    year: null,
    engine_size: null,
    description: ''
})

const selectedFiles = ref([])
const previewUrls = ref([])
const existingPhotos = ref([])
const photosToDelete = ref([])

// Initialize form when bike prop changes
watch(() => props.bike, (bike) => {
    if (bike) {
        editingBike.value = true
        form.value = {
            name: bike.name || '',
            brand: bike.brand || '',
            model: bike.model || '',
            year: bike.year || null,
            engine_size: bike.engine_size || null,
            description: bike.description || ''
        }
        existingPhotos.value = bike.photos || []
    } else {
        editingBike.value = false
        form.value = {
            name: '',
            brand: '',
            model: '',
            year: null,
            engine_size: null,
            description: ''
        }
        existingPhotos.value = []
    }

    selectedFiles.value = []
    previewUrls.value = []
    photosToDelete.value = []
}, { immediate: true })

const handleFilesSelect = (event) => {
    const files = Array.from(event.target.files)
    const totalPhotos = existingPhotos.value.length + previewUrls.value.length + files.length

    if (totalPhotos > 10) {
        notificationStore.error('Too many photos', 'Maximum 10 photos allowed per bike')
        return
    }

    for (const file of files) {
        const validation = validateImageFile(file)

        if (!validation.isValid) {
            notificationStore.error('Invalid file', validation.error)
            continue
        }

        selectedFiles.value.push(file)
        const imagePreview = createImagePreview(file)
        previewUrls.value.push(imagePreview.preview)
    }
}

const removeNewPhoto = (index) => {
    selectedFiles.value.splice(index, 1)
    previewUrls.value.splice(index, 1)
}

const removeExistingPhoto = (index) => {
    const photo = existingPhotos.value[index]
    if (photo.id) {
        photosToDelete.value.push(photo.id)
    }
    existingPhotos.value.splice(index, 1)
}

const handleSubmit = async () => {
    if (!form.value.name || loading.value) return

    const result = await execute(
        async () => {
            const formData = new FormData()

            // Add bike data
            formData.append('name', form.value.name)
            formData.append('brand', form.value.brand || '')
            formData.append('model', form.value.model || '')
            formData.append('year', form.value.year || '')
            formData.append('engine_size', form.value.engine_size || '')
            formData.append('description', form.value.description || '')

            // Add photos to delete
            if (photosToDelete.value.length > 0) {
                formData.append('photos_to_delete', JSON.stringify(photosToDelete.value))
            }

            // Add new photo files
            selectedFiles.value.forEach((file) => {
                formData.append('images', file)
            })

            const url = editingBike.value
                ? `/bikes/${props.bike.id}`
                : '/bikes'

            const method = editingBike.value ? 'put' : 'post'

            return await apiService[method](url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
        },
        {
            showErrorNotification: true,
            notificationStore,
            errorTitle: editingBike.value ? 'Update Failed' : 'Add Bike Failed'
        }
    )

    if (result) {
        notificationStore.success(
            editingBike.value ? 'Bike Updated' : 'Bike Added',
            editingBike.value ? 'Your bike has been updated successfully!' : 'Your bike has been added successfully!'
        )
        emit('saved', result)
        emit('close')
    }
}
</script>
