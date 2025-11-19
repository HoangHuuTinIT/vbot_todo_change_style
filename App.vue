<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch((options: UniApp.LaunchOptions) => {
    console.log('App Launch');
    
    const authStore = useAuthStore();
    authStore.initialize(options);
});

onShow(() => {
    console.log('App Show');
});

onHide(() => {
    console.log('App Hide');
});
</script>