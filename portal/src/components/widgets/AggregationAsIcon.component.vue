<template>
  <span class="p-2">
    <span v-if="noIcon">
      <span class="flex justify-center" v-if="accessIcon === 'public'">
        <img class="object-fill block" :src="publicCircle" :srcset="publicCircle" :style="{'height': '80px'}"/>
      </span>
      <span class="flex justify-center" v-if="accessIcon === 'login'">
        <img class="object-fill block" :src="loginCircle" :srcset="loginCircle" :style="{'height': '80px'}"/>
      </span>
    </span>
    <span v-else>
      <span class="flex justify-center">
        <font-awesome-icon
            :icon="['fa-solid', iconType]"
            size="3x"
            style="color: #919191;"/>
      </span>
      <span class="flex justify-center">
        <span>{{ item }}</span>
      </span>
    </span>
  </span>
</template>
<script>
import publicCircle from "@/assets/public.svg";
import loginCircle from "@/assets/login.svg";

export default {
  props: ['item'],
  data() {
    return {
      noIcon: false,
      iconType: 'file',
      accessIcon: 'none',
      publicCircle,
      loginCircle
    }
  },
  mounted() {
    switch (this.item) {
      case 'text/plain':
        this.iconType = 'file-lines';
        break;
      case 'text/csv':
        this.iconType = 'file-csv';
        break;
      case 'video/mp4':
        this.iconType = 'file-video';
        break;
      case 'application/xml':
        this.iconType = 'file-code';
        break;
      case 'application/zip':
        this.iconType = 'file-zipper';
        break;
      case 'application/pdf':
        this.iconType = 'file-pdf';
        break;
      case 'application/msword':
        this.iconType = 'file-word';
        break;
      case 'audio/mpeg' || 'audio/x-wav':
        this.iconType = 'file-audio';
        break;
      case 'application/x-ipynb+json':
        this.iconType = 'clipboard';
        break;
      case 'public':
        this.accessIcon = 'public';
        this.noIcon = true;
        break;
      case 'login':
        this.accessIcon = 'login';
        this.noIcon = true;
        break;
      default:
        this.noIcon = true;
    }
  }
}
</script>
