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
                            <FormField id="name" v-model="form.name" label="Bike Name" type="text" required
                                placeholder="My Awesome Brommer" />

                            <FormField id="brand" v-model="form.brand" label="Brand" type="text"
                                placeholder="Honda, Yamaha, etc." />
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField id="model" v-model="form.model" label="Model" type="text"
                                placeholder="CB125, YBR125, etc." />

                            <FormField id="year" v-model="form.year" label="Year" type="number" min="1950"
                                :max="new Date().getFullYear() + 1" />
                        </div>

                        <FormField id="engine_size" v-model="form.engine_size" label="Engine Size (cc)" type="number"
                            min="50" max="1000" placeholder="125" />

                        <!-- Description with RichTextEditor -->
                        <div class="space-y-2">
                            <RichTextEditor v-model="form.description" label="Description"
                                placeholder="Tell us about your bike, modifications, etc." :disabled="loading"
                                :min-length="0" :max-length="1000" />
                        </div>

                        <!-- Photo Upload -->
                        <ImageUpload v-model:images="allImages" label="Photos" variant="dropzone" :max-files="10"
                            :max-file-size="5 * 1024 * 1024" @error="(err) => error = err" />

                        <!-- Error Message -->
                        <ErrorSection v-if="error" :error="error" title="Form Error" />

                        <!-- Actions -->
                        <div class="flex justify-end space-x-3 pt-6">
                            <ActionButton type="button" variant="secondary" @click="$emit('close')" :disabled="loading">
                                Cancel
                            </ActionButton>
                            <ActionButton type="submit" :loading="loading" :disabled="!form.name || loading">
                                {{ editingBike ? 'Update Bike' : 'Add Bike' }}
                            </ActionButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useApi } from '@/composables/useApi'
import { apiService } from '@/services/api.service'
import ActionButton from '@/components/common/buttons/ActionButton.vue'
import ErrorSection from '@/components/common/sections/ErrorSection.vue'
import FormField from '@/components/common/forms/FormField.vue'
import ImageUpload from '@/components/common/forms/ImageUpload.vue'
import RichTextEditor from '@/components/common/forms/RichTextEditor.vue'

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
