<template>
  <template class="w-full" v-for="(b, index) of buckets" :key="b.key+'_'+index">
    <span v-if="!asIcons" class="font-semibold">{{ b.display }}:&nbsp;</span>
    <AggregationAsIcon v-if="asIcons" :item="b.key"/>
    <span v-else>{{ b.key }}</span>
  </template>
</template>
<script>
import AggregationAsIcon from "../widgets/AggregationAsIcon.component.vue";
import {uniqBy} from "lodash";

export default {
  components: {AggregationAsIcon},
  props: ['aggregations', 'field', 'asIcons'],
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
          })
        }
      }
      return uniqBy(buckets, 'name');
    }
  },
  methods: {
    findLicense(key) {
      let licenseType = '';
      this.licenses.find(l => {
        if (l.license === key) {
          licenseType = 'login';
        } else {
          licenseType = 'public'
        }
      });
      if (licenseType) {
        console.log(licenseType)
        return licenseType;
      } else {
        return key;
      }
    }
  }
}
</script>
