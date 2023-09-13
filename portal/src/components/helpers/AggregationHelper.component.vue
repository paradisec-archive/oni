<template>
  <template class="w-full" v-for="(b, index) of buckets" :key="b.key+'_'+index">
    <!--    <span v-if="!asIcons">{{ b.display }}:&nbsp;</span>-->
    <AggregationAsIcon v-if="asIcons" :item="b.key" :id="id" :field="field"/>
    <span v-else>{{ b.key }}&nbsp;</span>
  </template>
</template>
<script>
import AggregationAsIcon from "../widgets/AggregationAsIcon.component.vue";
import {isUndefined, uniqBy} from "lodash";

export default {
  components: {AggregationAsIcon},
  props: ['aggregations', 'field', 'asIcons', 'id'],
  data() {
    return {
      licenses: this.$store.state.configuration.ui?.licenses || []
    }
  },
  computed: {
    buckets() {
      const buckets = [];
      let bucketAggs = this.aggregations?.[this.field.name]?.buckets;
      if (Array.isArray(bucketAggs) && bucketAggs.length > 0) {
        for (let bucket of bucketAggs) {
          let key = '';
          if (this.field.name === 'license.@id') {
            key = this.findLicense(bucket.key);
          } else {
            key = bucket.key
          }
          buckets.push({
            key,
            name: this.field.name,
            display: this.field.display
          });
        }
      }
      return uniqBy(buckets, 'key');
    }
  },
  methods: {
    findLicense(key) {
      let license = this.licenses.find(l => l.license === key);
      if (license) {
        if (isUndefined(license.access)) {
          return 'login';
        } else {
          return license.access;
        }
      } else {
        return 'public';
      }
    }
  }
}
</script>
