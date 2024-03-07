<template>
  <SearchMap :model-value="results" :viewport="viewport" :buckets="buckets"/>
</template>
<script>
import SearchMap from "./SearchMap.component.vue";

export default {
  components: {
    SearchMap
  },
  data() {
    return {
      total: 0,
      items: [],
      results: [],
      viewport: {},
      buckets: [],
      errorText: '',
      loading: false
    }
  },
  async mounted() {
  },
  async updated() {
  },
  methods: {
  }
}


</script>

