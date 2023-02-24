<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="bg-white z-10">
    </div>
    <el-row :gutter="40" :offset="1" style="margin-right: 0">
      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4" class="max-w-0 h-auto">
        <div class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
          <search-bar ref='searchBar' @populate='populate' v-bind:searchInput="searchInput" @input="onInputChange"
                      @search="search" :clearSearch="clear" :filters="this.filters"
                      class="grid grid-row-2 justify-items-center items-center h-20 m-4"/>
        </div>
        <div class="pt-2">
          <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
            <ul v-if="aggs?.buckets?.length > 0"
                class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
              <li class="border-b-2">
                <button class="m-2 text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                </button>
              </li>
              <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
              <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"/>
            </ul>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20" :offset="0" v-loading="this.loading">
        <div class="pr-0">
          <div class="top-20 z-10 bg-white pb-5">
            <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
              <span class="my-1 mr-3" v-if="!isEmpty(this.$route.query.q)">Showing searches for: &nbsp;<span
                  class="px-3 border-dashed border-2 border-indigo-600">{{ this.$route.query.q }}</span></span>
              <span class="my-1 mr-1" v-if="!isEmpty(this.filters)">Filtering by:</span>
              <el-button-group class="my-1 mr-2" v-for="(filter, filterKey) of this.filters" :key="filterKey"
                               v-model="this.filters">
                <el-button plain>{{ clean(filterKey) }}</el-button>
                <el-button v-if="filter && filter.length > 0" v-for="f of filter" :key="f" color="#626aef" plain
                           @click="this.updateFilters({clear: {f, filterKey }})" class="text-2xl">
                  {{ clean(f) }}
                  <el-icon class="el-icon--right">
                    <CloseBold/>
                  </el-icon>
                </el-button>
              </el-button-group>
              <span class="my-1 mr-2">Total: {{ this.totals['value'] || 0 }} Index entries (Collections, Objects, Files and Notebooks)</span>
            </el-row>
            <el-row class="pt-2">
              <el-button-group v-if="(!isEmpty(this.$route.query.f) || !isEmpty(this.$route.query.q)) && !isStart">
                <el-button type="default" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
              </el-button-group>
            </el-row>
          </div>
          <!--          <div v-if="this.isStart">-->
          <!--            <div v-if="this.showTopCollections">-->
          <!--              <top-collections :collections="this.collections"/>-->
          <!--              <el-row>-->
          <!--                <el-link v-if="this.collectionTotals > this.collections.length"-->
          <!--                         @click="getNextCollections(this.collectionScrollId);this.newSearch=false;">more collections-->
          <!--                </el-link>-->
          <!--              </el-row>-->
          <!--            </div>-->
          <!--          </div>-->
          <div v-for="item of this.items" class="z-0 mt-0 mb-4 w-full">
            <search-detail-element :id="item._source['@id']" :href="getSearchDetailUrl(item)"
                                   :name="first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value']"
                                   :conformsTo="item.conformsTo" :types="item._source?.['@type']"
                                   :languages="item._source?.['language']"
                                   :_memberOf="item._source?._memberOf" :highlight="item?.highlight"
                                   :root="item._source?._root"
                                   :parent="item._source?._parent" :aggregations="aggregations"
                                   :details="item._source"/>
          </div>
          <div v-if="!this.items.length > 0">
            <el-row class="pb-4 items-center">
              <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
                No items were found with that search input
              </h5>
            </el-row>
            <el-row>
              <p class="text-center">
                <el-button type="primary" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
              </p>
            </el-row>
          </div>
          <el-row :gutter="2" v-if="this.more && !noMoreResults" class="flex justify-center p-6">
            <el-button @click="getNext()">
              <font-awesome-icon icon="fa-solid fa-arrow-alt-circle-down"/>&nbsp;VIEW MORE
            </el-button>
          </el-row>
          <el-row v-if="noMoreResults" class="flex justify-center p-6">
            <h5 class="mb-2 text-1xl tracking-tight dark:text-white">
              No more items found with that filter or search query
            </h5>
          </el-row>
        </div>
      </el-col>
    </el-row>
    <el-dialog v-model="errorDialogVisible" width="30%" center>
      <el-alert title="Error" type="warning" :closable="false">
        <p class="break-normal">{{ this.errorDialogText }}</p>
      </el-alert>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="errorDialogVisible = false">Close</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>


<script>

import {first, isEmpty, orderBy, toArray, find, isUndefined} from 'lodash';
import {CloseBold} from "@element-plus/icons-vue";
import {defineAsyncComponent, toRaw} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchAggs from './SearchAggs.component.vue';

export default {
  components: {
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
    SearchDetailElement,
    CloseBold,
    SearchAggs
  },
  data() {
    return {
      searchInput: '',
      items: [],
      totals: {},
      more: false,
      aggregations: {},
      memberOfBuckets: [],
      filters: {},
      clear: false,
      filterButton: [],
      loading: false,
      top: {},
      showTopCollections: false,
      showRepositoryCollections: false,
      collections: [],
      collectionTotals: 0,
      collectionScrollId: '',
      isStart: false,
      newSearch: true,
      isBrowse: false,
      errorDialogVisible: false,
      errorDialogText: '',
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,
      noMoreResults: false
    };
  },
  watch: {
    async '$route.query'() {
      this.loading = true;
      await this.updateFilters({});
      this.onInputChange(this.$route.query.q);
      await this.search();
      this.loading = false;
    }
  },
  async updated() {
    await this.updateRoutes();
  },
  async mounted() {
    this.loading = true;
    if (isEmpty(this.$route.query.f) && isEmpty(this.$route.query.q)) {
      //await this.resetSearch();
      console.log('not sure!')
    }
    await this.updateFilters({});
    await this.search(this.$route.query.q);
    this.loading = false;
  },
  methods: {
    toArray,
    first,
    isEmpty,
    isUndefined,
    async updateFilters({clear, empty}) {
      try {
        // updating filters from command
        if (clear?.f && clear?.filterKey) {
          if (this.filters[clear.filterKey]) {
            this.filters[clear.filterKey].splice(this.filters[clear.filterKey].indexOf(clear.f), 1);
            if (isEmpty(this.filters[clear.filterKey])) {
              delete this.filters[clear.filterKey];
            }
            //if there is an update on the filter the site will do another search.
            await this.updateRoutes();
          }
        } else {
          // or updating filters from routes
          if (isEmpty(this.$route.query.f)) {
            this.filters = {};
          } else {
            let filterQuery;
            const filters = decodeURIComponent(this.$route.query.f);
            filterQuery = JSON.parse(filters);
            this.filters = {};
            for (let [key, val] of Object.entries(filterQuery)) {
              this.filters[key] = val;
              if (this.filters[key].length === 0) {
                delete this.filters[key];
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    async updateRoutes() {
      let filters;
      const query = {q: this.$route.query.q}
      if (this.filters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
      }
      await this.$router.push({path: 'search', query, replace: true});
    },
    async bucketSelected({checkedBuckets, id}) {
      // this.filters[id] = checkedBuckets.map((k) => {
      //   return {key: k}
      // });
      this.filters[id] = checkedBuckets;
      await this.updateRoutes();
    },
    populate({items, newSearch}) {
      if (newSearch) {
        this.items = [];
        this.newSearch = true;
        this.scrollToTop();
      }
      if (items['_scroll_id']) {
        this.scrollId = items['_scroll_id'];
      }
      if (items['hits']) {
        const thisItems = items['hits']['hits'];
        this.totals = items['hits']['total'];
        if (thisItems.length > 0) {
          for (let item of thisItems) {
            this.items.push(item);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
      if (items['aggregations']) {
        this.aggregations = this.populateAggregations(items['aggregations']);
        this.memberOfBuckets = items['aggregations']?.['_memberOf.name.@value'];
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      //Note: below is converted to an ordered array not an object.
      const aggInfo = this.$store.state.configuration.ui.aggregations;
      for (let agg of Object.keys(aggregations)) {
        const info = aggInfo.find((a) => a['name'] === agg);
        const display = info?.display;
        const order = info?.order;
        const name = info?.name;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg
        };
      }
      return orderBy(a, 'order');
    },
    async getNext() {
      try {
        const items = await this.$elasticService.scroll(this.scrollId);
        if (items.error) {
          this.errorDialogVisible = true;
          this.errorDialogText = 'Your search session has expired, please reload';
        } else {
          if (items?.hits?.hits?.length > 0) {
            this.populate({items});
          } else {
            this.noMoreResults = true;
          }
        }
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogText = 'Your search session has expired, please reload';
      }
    },
    onInputChange(value) {
      this.searchInput = value;
    },
    async resetSearch() {
      this.clear = !this.clear;
      this.searchInput = '';
      this.$route.query.q = '';
      this.$route.query.f = '';
      this.$route.query.t = '';
      this.filterButton = [];
      this.isStart = true;
      this.isBrowse = false;
      //this.filters = {};
      await this.clearAggregations()
      await this.searchAll();
    },
    async searchAll() {
      this.isStart = false;
      await this.$router.push({path: 'search'});
      await this.search();
    },
    scrollToTop() {
      setTimeout(function () {
        // window.scroll({top: 0, left:0, behavior: 'smooth'});
        document.getElementById('app').scrollIntoView({behavior: 'smooth'});
      }, 100);
    },
    async clearAggregations() {
      for (let agg of this.aggregations) {
        //TODO: ask cos this may be silly?!?
        //this.$refs[agg][0].clear();
        const name = agg?.name;
        if (this.$refs[name]) {
          for (let r of this.$refs[name]) {
            r.clear();
          }
        }
      }
      this.filters = {};
    },
    async search(input) {
      this.noMoreResults = false;
      await this.$elasticService.requestNewSearch({
        scrollId: this.scrollId,
        collectionScrollId: this.collectionScrollId
      });
      if (input) {
        this.searchQuery = input;
      } else {
        this.searchQuery = this.$route.query.q || '';
      }
      let filters = {};
      if (!isEmpty(this.filters)) {
        filters = this.filters;
      } else {
        filters = {};
      }
      this.items = await this.$elasticService.multi({
        multi: this.searchQuery,
        filters: toRaw(filters),
        scroll: true
      });
      this.populate({items: this.items, newSearch: true});
    },
    getSearchDetailUrl(item) {
      //console.log(item);
      //TODO: this is not good, maybe do it with a ConformsTo to specify link. But have to think about it because not
      //      all files have conformsTo!
      let url;
      const types = item._source['@type'];
      const repoType = types.find(t => t === 'RepositoryCollection');
      const fileType = types.find(t => t === 'File');
      const itemType = types.find(t => t === 'RepositoryObject');
      let id = encodeURIComponent(item._source['@id']);
      let crateId = encodeURIComponent(first(item._source['_crateId'])?.['@value']);
      if (repoType) {
        url = `/collection?id=${id}&_crateId=${crateId}`
      } else if (itemType) {
        url = `/object?id=${id}&_crateId=${crateId}`
      } else if (fileType) {
        let isNotebook;
        if (item._source?.['conformsTo']) {
          isNotebook = item._source['conformsTo'].find(c => c['@id'] === this.conformsToNotebook);
        }
        if (isNotebook) {
          id = encodeURIComponent(item._id);
          url = `/object?_id=${id}`;
        } else {
          const fileId = id;
          id = encodeURIComponent(first(item._source['_parent'])?.['@id']);
          url = `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`
        }
      } else {
        //Defaults to object if it doesnt know what it is
        url = `/object?id=${id}&_crateId=${crateId}`
      }
      return url;
    },
    clean(string) {
      if (string === 'true') {
        return 'Yes';
      } else if (string === 'false') {
        return 'No';
      } else {
        string = string.replace(/@|_|(\..*)/g, "")
        return string;
      }
    }
  }
};
</script>
