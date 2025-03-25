<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    partName: {
        type: String,
        required: true
    },
    partId: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#00642b'
    },
    width: {
        type: String,
        default: '200px'
    },
    height: {
        type: String,
        default: '200px'
    }
});

const emit = defineEmits(['part-selected']);

const handleClick = () => {
    emit('part-selected', {
        id: props.partId,
        name: props.partName
    });
};
</script>

<template>
    <div class="part-block cursor-pointer rounded-lg flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        :style="{
            backgroundColor: color,
            width: width,
            height: height
        }" @click="handleClick">
        {{ partName }}
    </div>
</template>

<style scoped>
.part-block {
    position: relative;
    overflow: hidden;
}

.part-block::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    opacity: 0;
    transition: opacity 0.3s;
}

.part-block:hover::after {
    opacity: 1;
}
</style>
