<template>
  <template v-for="(f, index) of buckets" :key="f.field+'_'+index" v-loading="loading">
    <ul>
      <li v-if="f?.buckets.length > 0">
        <ul>
          <li><span class="font-semibold">{{ f.field }}</span></li>
          <template v-for="bucket of f?.buckets" :key="bucket.key">
            <li v-if="bucket.doc_count > 0" class="py-2">
              <PropertyValue :external="external" :id="bucket.id" :field="name" :value="bucket.key"
                             :fieldName="fieldName"/>
            </li>
          </template>
        </ul>
      </li>
    </ul>
  </template>
</template>
<script>
import {first} from 'lodash';
import PropertyValue from '../PropertyValue.component.vue'

export default {
  components: {
    PropertyValue
  },
  props: ['aggregations', 'fields', 'name', 'id', 'root', 'external', 'fieldName'],
  data() {
    return {
      buckets: [],
      loading: false
    }
  },
  async mounted() {
    this.loading = true;
    const result = await this.filter({'_collectionStack.@id': [this.id]});
    this.buckets = result.aggregations;
    this.loading = false;
  },
  computed() {
    this.loading = true;
    this.populateBuckets();
    this.loading = false;
  },
  watch: {},
  methods: {
    populateBuckets() {
      this.buckets = [];
      for (let field of this.fields) {
        if (this.aggregations && this.aggregations[field?.name]) {
          this.buckets.push({name: field.name, field: field.display, buckets: this.aggregations[field.name]?.buckets});
        }
      }
    },
    //TODO: refactor this integrate to multi
    async filter(filters) {
      const items = await this.$elasticService.multi({
        filters: filters,
        aggs: this.aggregations
      });
      if (items?.hits?.hits.length > 0) {
        return {
          data: items?.hits?.hits,
          aggregations: items?.aggregations,
          total: items.hits?.total.value,
          scrollId: items?._scroll_id,
          route: null
        }
      }
    }
  }
}
</script>
