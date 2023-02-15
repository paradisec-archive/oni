<template>
  <p id="license" v-if="!hideDescription">{{ first(this.license?.description)?.['@value'] }}</p>
  <span v-if="!hideDescription" id="readMoreLicense">
    <el-button v-if="!licenseSnipped" class="justify-self-center mt-2" @click="doSnip('#license')">Read more
  </el-button>
    </span>
  <div class="grid p-4">
    <span class="justify-self-center">
      <a class="underline" :href="this.license['@id']">
      {{ first(this.license.name)?.['@value'] }}</a>
    </span>
    <div class="bottom justify-self-center"></div>
  </div>
</template>
<script>
import {first, isEmpty} from "lodash";
import {initSnip, toggleSnip} from "../../tools";

export default {
  props: ['license', 'hideDescription'],
  data() {
    return {
      licenseSnipped: false,
      publicMetadataTitle: '',
      publicMetadataTip: '',
      allowTextIndexTitle: '',
      allowTextIndexTip: ''
    }
  },
  methods: {
    first,
    isEmpty,
    doSnip(selector) {
      toggleSnip(selector);
      this.licenseSnipped = true;
    }
  },
  mounted() {
  },
  updated() {
    if (!this.licenseSnipped) {
      initSnip('#license', '#readMoreLicense');
    }
  }
}
</script>
