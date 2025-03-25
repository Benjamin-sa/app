<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
    width: {
        type: Number,
        default: 800
    },
    height: {
        type: Number,
        default: 600
    }
});

const emit = defineEmits(['part-selected']);

const containerRef = ref(null);
let renderer, scene, camera, controls;
let motorcycle = null;
let raycaster = null;
let mouse = null;
let hoveredPart = null;
let partMaterials = {};
let partOriginalColors = {};

// Define motorcycle parts with their positions and colors
const motorcycleParts = [
    { id: 'wheels', name: 'Wheels', color: 0x00642b, position: { x: -1.5, y: 0, z: 0 }, scale: { x: 1, y: 0.2, z: 1 } },
    { id: 'engine', name: 'Engine', color: 0x004080, position: { x: 1.5, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
    { id: 'frame', name: 'Frame', color: 0x8B0000, position: { x: 0, y: 1, z: 0 }, scale: { x: 2, y: 0.2, z: 0.5 } },
    { id: 'exhaust', name: 'Exhaust', color: 0x707070, position: { x: 1, y: -0.5, z: 0 }, scale: { x: 0.7, y: 0.2, z: 0.2 } }
];

const init = () => {
    if (!containerRef.value) return;

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, props.width / props.height, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(props.width, props.height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.value.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create motorcycle parts
    motorcycle = new THREE.Group();

    motorcycleParts.forEach(part => {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshStandardMaterial({ color: part.color });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.set(part.position.x, part.position.y, part.position.z);
        mesh.scale.set(part.scale.x, part.scale.y, part.scale.z);
        mesh.name = part.id;
        mesh.userData = { name: part.name, id: part.id };

        partMaterials[part.id] = material;
        partOriginalColors[part.id] = part.color;

        motorcycle.add(mesh);
    });

    scene.add(motorcycle);

    // Initialize raycaster and mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add event listeners
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onMouseClick);

    animate();
};

const onMouseMove = (event) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Reset previously hovered part
    if (hoveredPart) {
        partMaterials[hoveredPart].color.setHex(partOriginalColors[hoveredPart]);
        hoveredPart = null;
    }

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(motorcycle.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        hoveredPart = object.name;

        // Highlight the hovered part
        partMaterials[hoveredPart].color.setHex(0xffaa00);

        // Change cursor
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'auto';
    }
};

const onMouseClick = (event) => {
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(motorcycle.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        emit('part-selected', {
            id: object.userData.id,
            name: object.userData.name
        });
    }
};

const animate = () => {
    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
};

// Handle window resize
const handleResize = () => {
    if (camera && renderer) {
        camera.aspect = props.width / props.height;
        camera.updateProjectionMatrix();
        renderer.setSize(props.width, props.height);
    }
};

onMounted(() => {
    init();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);

    if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('click', onMouseClick);
        renderer.dispose();
    }

    // Clean up Three.js resources
    if (scene) {
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
            }
        });
    }
});
</script>

<template>
    <div class="motorcycle-3d-container" :style="{ width: `${width}px`, height: `${height}px` }" ref="containerRef">
    </div>
</template>

<style scoped>
.motorcycle-3d-container {
    position: relative;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
