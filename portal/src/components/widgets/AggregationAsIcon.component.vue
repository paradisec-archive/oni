<template>
  <span class="p-2">
    <span v-if="noIcon">
      <span class="flex justify-center" v-if="accessIcon === 'public'">
        <img class="object-fill block" :src="publicCircle" :srcset="publicCircle" :style="{'height': '60px'}"/>
      </span>
      <span class="flex justify-center" v-if="accessIcon === 'login'">
        <img class="object-fill block" :src="loginCircle" :srcset="loginCircle" :style="{'height': '60px'}"/>
      </span>
    </span>
    <span v-else>
      <span class="flex justify-center">
        <el-tooltip
            class="box-item"
            effect="dark"
            :content="item"
            placement="bottom"
        >
        <font-awesome-icon
            :icon="['fa-solid', iconType]"
            size="2x"
            style="color: rgba(0,0,0,0.55);"/>
      </el-tooltip>
      </span>
    </span>
  </span>
</template>
<script>
import publicCircle from "@/assets/public.svg";
import loginCircle from "@/assets/login.svg";

export default {
  props: ['item', 'id', 'field'],
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
    if (/text\/plain/.test(this.item)) {
      this.iconType = 'file-lines';
    } else if (/text\/csv/.test(this.item)) {
      this.iconType = 'file-csv';
    } else if (/video\/mp4/.test(this.item)) {
      this.iconType = 'file-video';
    } else if (/xml/.test(this.item)) {
      this.iconType = 'file-code';
    } else if (/application\/zip/.test(this.item)) {
      this.iconType = 'file-zipper';
    } else if (/application\/pdf/.test(this.item)) {
      this.iconType = 'file-pdf';
    } else if (/application\/msword/.test(this.item)) {
      this.iconType = 'file-word';
    } else if (/audio\/mpeg/.test(this.item) || /audio\/x-wav/.test(this.item)) {
      this.iconType = 'file-audio';
    } else if (/application\/x-ipynb+json/.test(this.item)) {
      this.iconType = 'clipboard';
    } else if (/WrittenLanguage/.test(this.item)) {
      this.iconType = 'fa-feather';
    } else if (/SpokenLanguage/.test(this.item)){
        this.iconType = 'fa-microphone-lines';
    } else if (/Song/.test(this.item)){
      this.iconType = 'fa-music';
    } else if (/Gesture/.test(this.item)){
      this.iconType = 'fa-hand';
    } else if (/SignLanguage/.test(this.item)){
      this.iconType = 'fa-hands-asl-interpreting';
    } else if (/WhistledLanguage/.test(this.item)){
      this.iconType = 'fa-face-kiss';
    } else if (/public/.test(this.item)) {
      this.accessIcon = 'public';
      this.noIcon = true;
    } else if (/login/.test(this.item)) {
      this.accessIcon = 'login';
      this.noIcon = true;
    } else {
      this.noIcon = true;
    }
  }
}
</script>
