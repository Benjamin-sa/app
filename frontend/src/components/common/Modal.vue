<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto" @click="handleBackdropClick">
                <!-- Backdrop -->
                <div class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity" />

                <!-- Modal container -->
                <div class="flex min-h-full items-center justify-center p-4">
                    <Transition enter-active-class="transition duration-300 ease-out"
                        enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100"
                        leave-active-class="transition duration-200 ease-in"
                        leave-from-class="transform opacity-100 scale-100"
                        leave-to-class="transform opacity-0 scale-95">
                        <div v-if="modelValue" :class="[
                            'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-full overflow-hidden',
                            sizeClasses,
                        ]" @click.stop>
                            <!-- Header -->
                            <div v-if="$slots.header || title || closable"
                                class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div class="flex-1">
                                    <slot name="header">
                                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                            {{ title }}
                                        </h3>
                                    </slot>
                                </div>
                                <button v-if="closable" @click="close"
                                    class="ml-4 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:text-gray-500 dark:focus:text-gray-400 transition ease-in-out duration-150"
                                    type="button">
                                    <span class="sr-only">Close</span>
                                    <XMarkIcon class="w-6 h-6" />
                                </button>
                            </div>

                            <!-- Body -->
                            <div :class="['p-6 overflow-y-auto', bodyHeightClasses]">
                                <slot />
                            </div>

                            <!-- Footer -->
                            <div v-if="$slots.footer"
                                class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                                <slot name="footer" />
                            </div>
                        </div>
                    </Transition>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false,
    },
    title: {
        type: String,
        default: '',
    },
    size: {
        type: String,
        default: 'md',
        validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl', 'full'].includes(value),
    },
    closable: {
        type: Boolean,
        default: true,
    },
    closeOnBackdrop: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['update:modelValue', 'close']);

const sizeClasses = computed(() => {
    const sizes = {
        xs: 'w-full max-w-xs',
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-2xl',   // 672px - better for forms
        full: 'w-full max-w-4xl', // 896px - more reasonable full size
    };
    return sizes[props.size];
});

const bodyHeightClasses = computed(() => {
    const heights = {
        xs: 'max-h-64',      // 256px
        sm: 'max-h-80',      // 320px
        md: 'max-h-96',      // 384px (original)
        lg: 'max-h-[500px]', // 500px
        xl: 'max-h-[600px]', // 600px
        full: 'max-h-[80vh]', // 80% of viewport height
    };
    return heights[props.size];
});

const close = () => {
    emit('update:modelValue', false);
    emit('close');
};

const handleBackdropClick = () => {
    if (props.closeOnBackdrop) {
        close();
    }
};

// Handle escape key
watch(() => props.modelValue, (isOpen) => {
    const handleEscape = (event) => {
        if (event.key === 'Escape' && props.closable) {
            close();
        }
    };

    if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
    } else {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
    }
});
</script>
