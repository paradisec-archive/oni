<template>
  <div v-if="errorText">error: {{ errorText }}</div>
  <br/>
  <div>Total: {{ total }}</div>
  <SearchMap :model-value="results" :viewport="viewport"/>
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
      errorText: '',
      loading: false
    }
  },
  async mounted() {
    await this.search();
    this.updateResults();
  },
  async updated() {
    // await this.search();
  },
  watch: {
    items: {
      handler() {
        //this.updateResults();
      },
      flush: 'post',
      immediate: false
    }
  },
  methods: {
    async search() {
      try {
        this.loading = true;
        const items = await this.$elasticService.map({});
        this.total = items.hits.total.value;
        this.items = items.hits.hits;
        this.viewport = items.aggregations.viewport;
      } catch (e) {
        this.errorText = e.message;
        this.loading = false;
      }
    },
    updateResults(){
      const results = []
      for (let item of this.items || []) {
        results.push(item['_source']);
      }
      this.results = results;
      console.log('hello')
    }
  }
}


</script>

