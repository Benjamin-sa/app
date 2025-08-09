<template>
    <footer class="bg-gray-900 text-white">
        <!-- Main Footer Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                <!-- Brand Section -->
                <div class="lg:col-span-1">
                    <div class="flex items-center space-x-2 mb-4">
                        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-sm">M</span>
                        </div>
                        <span class="text-xl font-bold">Motordash</span>
                    </div>
                    <p class="text-gray-400 mb-6 text-sm leading-relaxed">
                        The ultimate motorcycle community platform connecting enthusiasts worldwide. Share your passion,
                        discover gear, and join the ride.
                    </p>
                    <div class="flex space-x-4">
                        <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200"
                            aria-label="Facebook">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200"
                            aria-label="Twitter">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200"
                            aria-label="Instagram">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.329-1.297L6.826 14.11c.656.656 1.556 1.062 2.562 1.062 1.958 0 3.555-1.597 3.555-3.555S11.346 8.062 9.388 8.062s-3.555 1.597-3.555 3.555c0 .328.045.646.127.95L4.364 13.16c-.328-.656-.516-1.394-.516-2.177 0-2.732 2.217-4.949 4.949-4.949s4.949 2.217 4.949 4.949-2.217 4.949-4.949 4.949z" />
                            </svg>
                        </a>
                        <a href="#" class="text-gray-400 hover:text-white transition-colors duration-200"
                            aria-label="YouTube">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path
                                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div>
                    <h3 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Community</h3>
                    <ul class="space-y-3">
                        <li>
                            <router-link to="/forum"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Discussion Forum
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/bikes"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Bike Gallery
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/forum/category/general"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                General Discussion
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/forum/category/maintenance"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Maintenance Tips
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/forum/category/rides"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Group Rides
                            </router-link>
                        </li>
                    </ul>
                </div>

                <!-- Products & Gear -->
                <div>
                    <h3 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Products & Gear</h3>
                    <ul class="space-y-3">
                        <li>
                            <router-link to="/products"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Browse Products
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/products?category=helmets"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Helmets & Safety
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/products?category=gear"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Riding Gear
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/products?category=parts"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Parts & Accessories
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/products?category=tools"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Tools & Maintenance
                            </router-link>
                        </li>
                    </ul>
                </div>

                <!-- Support & Info -->
                <div>
                    <h3 class="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h3>
                    <ul class="space-y-3">
                        <li>
                            <router-link to="/about"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                About Motordash
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/help"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Help Center
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/contact"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Contact Us
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/privacy"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Privacy Policy
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/terms"
                                class="text-gray-400 hover:text-white transition-colors duration-200 text-sm">
                                Terms of Service
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Newsletter Signup -->
            <div class="border-t border-gray-800 mt-12 pt-8">
                <div class="max-w-md mx-auto text-center">
                    <h3 class="text-white font-semibold mb-2">Stay Connected</h3>
                    <p class="text-gray-400 text-sm mb-4">Get the latest motorcycle news, tips, and community updates
                        delivered to your inbox.</p>
                    <form @submit.prevent="handleNewsletterSignup" class="flex">
                        <input v-model="newsletterEmail" type="email" placeholder="Enter your email"
                            class="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            required>
                        <button type="submit" :disabled="subscribing"
                            class="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed rounded-r-lg font-medium transition-colors duration-200">
                            {{ subscribing ? 'Joining...' : 'Join' }}
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Bottom Bar -->
        <div class="border-t border-gray-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div class="flex items-center space-x-4 text-sm text-gray-400">
                        <span>&copy; {{ currentYear }} Motordash. All rights reserved.</span>
                        <span class="hidden md:inline">•</span>
                        <span class="flex items-center space-x-1">
                            <HeartIcon class="w-4 h-4 text-red-500" />
                            <span>Made for riders, by riders</span>
                        </span>
                    </div>
                    <div class="flex items-center space-x-6 text-sm">
                        <button @click="scrollToTop"
                            class="text-gray-400 hover:text-white transition-colors duration-200 flex items-center space-x-1">
                            <ArrowUpIcon class="w-4 h-4" />
                            <span>Back to top</span>
                        </button>
                        <div class="flex items-center space-x-2 text-gray-400">
                            <span>🌐</span>
                            <select v-model="selectedLanguage" @change="handleLanguageChange"
                                class="bg-transparent border-none text-gray-400 text-sm focus:outline-none cursor-pointer">
                                <option value="en">English</option>
                                <option value="nl">Nederlands</option>
                                <option value="de">Deutsch</option>
                                <option value="fr">Français</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { HeartIcon, ArrowUpIcon } from '@heroicons/vue/24/outline';
import { useNotificationStore } from '@/stores/ui/notification';

const notificationStore = useNotificationStore();

// Newsletter signup
const newsletterEmail = ref('');
const subscribing = ref(false);

// Language selection
const selectedLanguage = ref('en');

// Current year for copyright
const currentYear = computed(() => new Date().getFullYear());

const handleNewsletterSignup = async () => {
    if (!newsletterEmail.value) return;

    subscribing.value = true;

    try {
        // Simulate API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1000));

        notificationStore.success('Subscribed successfully', 'Thanks for subscribing to our newsletter!');

        newsletterEmail.value = '';
    } catch (error) {
        notificationStore.error('Failed to subscribe. Please try again.');
    } finally {
        subscribing.value = false;
    }
};

const handleLanguageChange = () => {
    // Implement language change logic here
    notificationStore.info(`Language changed to ${selectedLanguage.value.toUpperCase()}`);
};

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};
</script>

<style scoped>
/* Custom scrollbar for select on hover */
select:hover {
    color: white;
}

/* Focus styles for accessibility */
a:focus,
button:focus,
input:focus,
select:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.5);
    border-radius: 0.25rem;
}

/* Smooth transitions */
* {
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}
</style>
