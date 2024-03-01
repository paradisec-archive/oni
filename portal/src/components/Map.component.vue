<template>
  <div class="pr-0">
    <div class="top-20 z-10 bg-white pb-3">
      <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
        <el-col :span="20" class="m-2" :xs="18" :sm="17" :md="17" :lg="20" :xl="18">
          <span id="total_results" class="my-1 mr-2" v-show="total">Total: <span>{{ total }} Index entries (Collections, Objects, Files and Notebooks)</span></span>
          <span v-if="errorText">error: {{ errorText }}</span>
        </el-col>
        <el-col :span="2" class="m-2" :xs="4" :sm="5" :md="5" :lg="2" :xl="4">
          <el-button size="large" @click="showList()">
            <span><font-awesome-icon icon="fa-solid fa-list"/>&nbsp;List view</span>
          </el-button>
        </el-col>
      </el-row>
    </div>
  </div>
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
    await this.search();
  },
  async updated() {
    //await this.search();
    //this.updateResults();
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
    showList() {
      this.$router.push({path: '/search'});
    },
    async search() {
      try {
        this.loading = true;
        const items = await this.$elasticService.map({});
        this.total = items.hits?.total.value || 0;
        this.items = items.hits?.hits || [];
        //this.viewport = items.aggregations?.viewport;
        const results = []
        for (let item of this.items || []) {
          results.push(item['_source']);
        }
        this.results = results;
        this.buckets = this.viewport?.buckets;
      } catch (e) {
        this.errorText = e.message;
        this.loading = false;
      }
    }
  }
}


</script>

