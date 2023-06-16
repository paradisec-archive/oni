<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="bg-white z-10">
    </div>
    <el-row :gutter="40" :offset="1" style="margin-right: 0" class="flex flex-row h-screen">
      <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="5" :span="4"
              class="h-full max-h-screen overflow-y-auto flex flex-col flex-grow ">
        <div class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
          <search-bar ref='searchBar' @populate='populate' v-bind:searchInput="searchInput" @input="onInputChange"
                      @search="search" :clearSearch="clear" :filters="this.filters" :fields="searchFields"
                      class="grow justify-items-center items-center m-4" :showFields="true"/>
        </div>
        <div class="pt-2">
          <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
            <ul v-if="aggs?.buckets?.length > 0 && !aggs['hide']"
                class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
              <li @click="aggs.active = !aggs.active"
                  class="hover:cursor-pointer py-3 flex md:flex md:flex-grow flex-row justify-between space-x-1">
                <span class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                </span>

                <span class="py-1 px-2">
                    <font-awesome-icon v-if="aggs.active" icon="fa fa-chevron-down"/>
                  <span v-else>
                    <span class="text-xs rounded-full w-32 h-32 text-white bg-red-600 p-1">{{
                        aggs?.buckets?.length
                      }}</span>&nbsp;
                    <font-awesome-icon icon="fa fa-chevron-right"/>
                    </span>
                </span>
              </li>
              <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
              <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"
                           v-show="aggs.active" @is-active="aggs.active = true"/>
            </ul>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="19" :span="20" :offset="0"
              class="max-h-screen overflow-y-auto">
        <div class="pr-0">
          <div class="top-20 z-10 bg-white pb-5">
            <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
              <span class="my-1 mr-3" v-if="!isEmpty(this.$route.query.q)">Showing searches for: &nbsp;
                <span class="px-3 border-dashed border-2 border-indigo-600">{{ this.$route.query.q }}</span>
              </span>
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
              <span id="total_results"
                    class="my-1 mr-2" v-show="this.totals['value']">Total: <span>{{ this.totals['value'] }} Index entries (Collections, Objects, Files and Notebooks)</span></span>
            </el-row>
            <el-row class="pt-2">
              <el-col :span="24" class="flex space-x-4">
                <el-button-group v-if="(!isEmpty(this.$route.query.f) || !isEmpty(this.$route.query.q)) && !isStart"
                                 class="my-1">
                  <el-button type="default" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
                </el-button-group>
                <el-select v-model="selectedSorting" @change="sortResults" class="my-1">
                  <template #prefix>Sort by:</template>
                  <el-option
                      v-for="item in sorting"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                  />
                </el-select>
                <el-select v-model="selectedOrder" @change="orderResults" class="my-1">
                  <template #prefix>Order by:</template>
                  <el-option
                      v-for="item in ordering"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                  />
                </el-select>
              </el-col>
            </el-row>
          </div>
          <div class="py-2 w-full">
            <el-pagination class="items-center w-full"
                           background layout="prev, pager, next"
                           :total="totals['value']"
                           v-model:page-size="pageSize"
                           @update:page-size="pageSize"
                           v-model:currentPage="currentPage"
                           @current-change="updatePages($event, 'top_menu')"/>
          </div>
          <div v-for="item of this.items" :key="item._id"
               class="z-0 mt-0 mb-4 w-full"
               v-loading="loading">
            <search-detail-element v-if="item._source" :id="item._source['@id']" :href="getSearchDetailUrl(item)"
                                   :name="first(item._source.name)?.['@value'] || first(first(item._source.identifier)?.value)?.['@value']"
                                   :conformsTo="item.conformsTo" :types="item._source?.['@type']"
                                   :_memberOf="item._source?._memberOf" :highlight="item?.highlight"
                                   :root="item._source?._root"
                                   :parent="item._source?._parent" :aggregations="aggregations"
                                   :details="item._source" :score="item._score"/>
          </div>
          <div v-loading="loading" v-if="!this.items.length > 0">
            <el-row class="pb-4 items-center">
              <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
                <span v-if="!loading">No items found</span>
              </h5>
            </el-row>
            <el-row>
              <p class="text-center">
                <el-button type="primary" v-on:click="this.resetSearch">RESTART SEARCH</el-button>
              </p>
            </el-row>
          </div>
          <el-row v-if="noMoreResults" class="flex justify-center p-6">
            <h5 class="mb-2 text-1xl tracking-tight dark:text-white">
              No more items found with that filter or search query
            </h5>
          </el-row>
          <div class="py-2 w-full">
            <el-pagination class="items-center w-full"
                           background layout="prev, pager, next"
                           :total="totals['value']"
                           v-model:page-size="pageSize"
                           @update:page-size="pageSize"
                           v-model:currentPage="currentPage"
                           @current-change="updatePages($event, 'total_results')"/>
          </div>
        </div>
      </el-col>
    </el-row>
    <el-dialog v-model="errorDialogVisible" width="40%" center>
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

import {first, last, isEmpty, orderBy, toArray, find, isUndefined} from 'lodash';
import {CloseBold} from "@element-plus/icons-vue";
import {defineAsyncComponent, toRaw} from "vue";
import SearchDetailElement from './SearchDetailElement.component.vue';
import SearchAggs from './SearchAggs.component.vue';
import {putLocalStorage} from '@/storage';

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
      pageSize: 10,
      currentPage: 1,
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
      isStart: false,
      newSearch: true,
      isBrowse: false,
      errorDialogVisible: false,
      errorDialogText: '',
      conformsToNotebook: this.$store.state.configuration.ui.conformsTo?.notebook,
      noMoreResults: false,
      searchFields: this.$store.state.configuration.ui.searchFields,
      sorting: [
        {value: 'relevance', label: 'Relevance'},
        {value: '_isTopLevel.@value.keyword', label: 'Collections First'}
      ],
      selectedSorting: {value: '_isTopLevel.@value.keyword', label: 'Collections First'},
      ordering: [
        {value: 'asc', label: 'Ascending'},
        {value: 'desc', label: 'Descending'}
      ],
      selectedOrder: {value: 'desc', label: 'Descending'},
      searchFrom: 0,
      selectedOperation: 'should'
    };
  },
  watch: {
    async '$route.query'() {
      this.loading = true;
      await this.updateFilters({});
      this.onInputChange(this.$route.query.q);
      //Every new search will force sort relevance:
      this.selectedSorting = this.sorting[0];
      this.currentPage = 1;
      await this.search({sort: this.selectedSorting.value});
      this.loading = false;
    }
  },
  async updated() {
    console.log('updated')
    console.log(this.selectedOperation);
    // if (this.$route.query.q) {
    //   this.selectedSorting = 'relevance'; //TODO: WHY?? do we need to update the currentPage?
    // }
    if (this.$route.query.o) {
      this.selectedOperation = this.$route.query.o
    }
    if (!this.$route.query.sf) {
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      console.log(this.searchFields);
    }
    console.log('this.searchFields');
    console.log(this.searchFields);
    // await this.updateRoutes();
    putLocalStorage({key: 'lastRoute', data: this.$route.fullPath});
  },
  async mounted() {
    console.log('mounted')
    this.loading = true;
    if (isEmpty(this.$route.query.f) && isEmpty(this.$route.query.q)) {
      //await this.resetSearch();
      console.log('not sure!')
    }
    await this.updateFilters({});
    if (this.$route.query.q) {
      this.selectedSorting = this.sorting[0];
    }
    if (this.$route.query.o) {
      this.selectedOperation = this.$route.query.o;
    }
    if (!this.$route.query.sf) {
      this.searchFields = this.$store.state.configuration.ui.searchFields;
    }
    //await this.search({input: this.$route.query.q});
    this.loading = false;
  },
  async created() {
    console.log('created');
    if (this.$route.query.q) {
      this.selectedSorting = this.sorting[0];
    }
    if (!this.$route.query.sf) {
      this.searchFields = this.$store.state.configuration.ui.searchFields;
    }
    if (this.$route.query.o) {
      this.selectedOperation = this.$route.query.o;
    }
    const aggregations = await this.$elasticService.multi({
      multi: '',
      filters: {},
      sort: this.sorting[0].value,
      order: 'desc',
      operation: 'must',
      pageSize: 10,
      searchFrom: 0
    });
    this.aggregations = this.populateAggregations(aggregations['aggregations']);
    // await this.search({input: this.$route.query.q});
    await this.searchAll();
    putLocalStorage({key: 'lastRoute', data: this.$route.fullPath});
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
      const query = {q: this.$route.query.q, sf: this.$route.query.sf}
      if (!this.$route.query.sf) {
        this.searchFields = this.$store.state.configuration.ui.searchFields;
        query.sf = encodeURIComponent(JSON.stringify(this.searchFields));
      }
      if (this.filters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
      }
      if (!this.$route.query.o) {
        query.o = this.selectedOperation;
      } else {
        query.o = this.$route.query.o;
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
    populate({items, newSearch, aggregations}) {
      this.items = [];
      if (newSearch) {
        this.newSearch = true;

      }
      if (items?.['hits']) {
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
      if (items?.['aggregations']) {
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
        const hide = info?.hide;
        const active = info?.active;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg,
          hide: hide,
          active: active
        };
      }
      return orderBy(a, 'order');
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
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      this.$route.query.sf = encodeURIComponent(this.searchFields);
      this.$route.query.o = this.selectedOperation;
      this.selectedSorting = this.sorting[0];
      console.log(this.selectedSorting);
      this.filterButton = [];
      this.isStart = true;
      this.isBrowse = false;
      this.currentPage = 1;
      //this.filters = {};
      await this.clearAggregations()
      await this.searchAll();
    },
    async searchAll() {
      this.isStart = false;
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      const sf = encodeURIComponent(JSON.stringify(this.searchFields));
      const query = {o: this.selectedOperation, sf: sf};
      if (this.$route.query.q) {
        query.q = this.$route.query.q;
      }
      await this.$router.push({path: 'search', query});
      await this.search({});
    },
    scrollToTop(id) {
      setTimeout(function () {
        // window.scroll({top: 0, left:0, behavior: 'smooth'});
        document.getElementById(id).scrollIntoView({behavior: 'smooth'});
      }, 100);
    },
    async clearAggregations() {
      if (this.aggregations) {
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
      }
      this.filters = {};
    },
    async search({input, sort, order}) {
      this.loading = true;
      this.noMoreResults = false;
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
      if (!isEmpty(this.$route.query.sf)) {
        try {
          this.searchFields = JSON.parse(decodeURIComponent(this.$route.query.sf));
        } catch (e) {
          this.searchFields = this.$store.state.configuration.ui.searchFields;
        }
      }
      if (this.$route.query.o) {
        this.selectedOperation = this.$route.query.o;
      }
      try {
        this.items = await this.$elasticService.multi({
          multi: this.searchQuery,
          filters: toRaw(filters),
          searchFields: this.searchFields,
          sort: sort || this.sorting[0].value,
          order: order || this.selectedOrder['value'] || this.selectedOrder,
          operation: this.selectedOperation,
          pageSize: this.pageSize,
          searchFrom: (this.currentPage - 1) * this.pageSize
        });
        this.populate({items: this.items, newSearch: true, aggregations: this.aggregations});
        this.loading = false;
      } catch (e) {
        this.errorDialogVisible = true;
        this.errorDialogText = e.message;
        this.loading = false;
      }
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
    },
    sortResults(sort) {
      this.currentPage = 1;
      const order = this.selectedOrder['value'] || this.selectedOrder;
      this.search({input: this.searchQuery, sort, order});
    },
    orderResults(order) {
      this.currentPage = 1;
      const sort = this.selectedSorting.value;
      this.search({input: this.searchQuery, sort, order});
    },
    async updatePages(page, scrollTo) {
      this.currentPage = page;
      const order = this.selectedOrder['value'] || this.selectedOrder;
      const sort = this.selectedSorting.value;
      await this.search({input: this.searchQuery, sort, order});
      this.scrollToTop(scrollTo)
    }
  }
};
</script>
