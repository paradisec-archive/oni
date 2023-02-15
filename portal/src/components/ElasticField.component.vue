<template>
  <template v-if="title === 'base64'">
    <NotebookViewerWidget :ipynb="value" />
  </template>
  <template v-else>
    <template v-if="url">
      <a class="break-words underline text-blue-600 hover:text-blue-800 visited:text-purple-600" :href="id"
        target="_blank" rel="nofollow noreferrer">{{ name || id }}</a>
    </template>
    <template v-else-if="value">{{ value }}</template>
    <template v-else>
      <p>
        {{ name }}
        <el-tooltip v-if="description" class="box-item" effect="light" trigger="click" :content="description"
          placement="top">
          <el-button size="small" link>
            <font-awesome-icon icon="fa-solid fa-circle-info" />
          </el-button>
        </el-tooltip>
      </p>
    </template>
  </template>
</template>
<script>
import { first, isEmpty } from "lodash";
import convertSize from "convert-size";
import {defineAsyncComponent} from 'vue';

export default {
  components: {
    NotebookViewerWidget: defineAsyncComponent(() =>
        import('./widgets/NotebookViewerWidget.component.vue')
    )
  },
  props: ['field', 'title'],
  data() {
    return {
      id: '',
      name: '',
      description: '',
      url: '',
      value: '',
      byteFields: this.$store.state.configuration.ui?.main?.byteFields || []
    }
  },
  mounted() {
    this.id = this.field?.['@id'] || this.field?.['@value'];
    this.url = this.testURL(this.id);
    this.name = first(this.field?.['name'])?.['@value'];
    this.description = first(this.field?.['description'])?.['@value'];
    // This only if the value is ever empty, AKA not indexed or resolved
    if (isEmpty(this.name)) {
      this.name = this.id;
      if (isEmpty(this.description)) {
        this.description = 'This value only has an Id';
      }
    }
    if (this.title === 'base64') {

    }
    this.value = this.cleanValue();
  },
  methods: {
    first,
    testURL(url) {
      if (typeof url === 'string' && url?.startsWith('http')) { //TODO: make this a real url test
        return url;
      }
    },
    cleanValue() {
      if (this.byteFields.find(f => f.toLowerCase() === this.title?.toLowerCase())) {
        return this.convert(this.field?.['@value']);
      } else {
        return this.field?.['@value'] || null;
      }
    },
    convert(value) {
      try {
        return convertSize(parseInt(value), { accuracy: 2 });
      } catch (e) {
        return value;
      }
    }
  }
}
</script>
