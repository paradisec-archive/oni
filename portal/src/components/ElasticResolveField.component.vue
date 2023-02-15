<template>
  <template v-if="isURL">
    <a class="break-words break-all underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
       :href="this.field" target="_blank">{{
        this.field
      }}</a>
  </template>
  <template v-else>
    <el-link class="break-words break-all" type="primary" :href="this.link">{{ this.field }}</el-link>&nbsp;
    <el-tooltip v-if="this.field"
                class="box-item"
                effect="light"
                trigger="click"
                content="This is a sharable link, right click and copy it to share"
                placement="top"
    >
      <el-button link>
        <font-awesome-icon icon="fa-solid fa-circle-info"/>
      </el-button>
    </el-tooltip>
  </template>
</template>
<script>
import {first} from "lodash";

export default {
  props: ['name', 'field', 'routePath', 'filePath', 'parentId', 'crateId'],
  data() {
    return {
      isURL: false,
      link: ''
    }
  },
  mounted() {
    if (this.field) {
      this.isURL = this.testURL(this.field)
      if (!this.isURL) {
        this.link = this.tryResolve();
      }
    }
  },
  methods: {
    first,
    testURL(url) {
      if (typeof url === 'string') {
        return url.startsWith('http');
      }
    },
    tryResolve(uri) {
      if (this.filePath) {
        return `/${this.routePath}?id=${encodeURIComponent(this.parentId)}&_crateId=${encodeURIComponent(this.crateId)}&fileId=${this.filePath}`;
      } else {
        return `/${this.routePath}?id=${encodeURIComponent(this.field)}&_crateId=${encodeURIComponent(this.crateId)}`;
      }
    }
  }
}
</script>
