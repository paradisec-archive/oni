<template>
  <div><!-- Wrapping an empty div because of multiple roots with v-for-->
    <el-row :align="'middle'">
      <h5 class="text-2xl font-medium dark:text-white">
        <a :href="href" class="text-blue-600 hover:text-blue-800 visited:text-purple-600 break-all">
          {{ this.name || this.id }}</a>
      </h5>
    </el-row>
    <el-row :align="'middle'">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        {{ conformsTo }}
      </p>
    </el-row>
    <el-row :align="'middle'">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        Contains:&nbsp;
      </p>
      <div class="flex flex-wrap">
        <button class="text-sm  m-2 text-gray-400 dark:text-gray-300" v-for="type of types">
          {{ type }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="languages">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        Languages:
      </p>
      <div class="flex flex-wrap">
        <button class="text-sm m-2 text-gray-400 dark:text-gray-300 " v-for="language of languages">
          {{ first(language.name)?.['@value'] }}
        </button>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="Array.isArray(_memberOf) && _memberOf.length > 0" class="pt-2">
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
        Member Of:&nbsp;
      </p>
      <div class="flex flex-wrap">
        <a v-for="mO of _memberOf"
           :href="'/collection?id=' + mO?.['@id'] + '&_crateId=' + encodeURIComponent(mO?.['@id'])">
          <el-button>{{ first(mO?.name)?.['@value'] || mO?.['@id'] }}</el-button>
        </a>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="Array.isArray(parent) && parent.length > 0" class="pt-2">
      <!--      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">-->
      <!--        From:&nbsp;-->
      <!--      </p>-->
      <!--      <div class="flex flex-wrap">-->
      <!--        <a v-for="p of parent" :href="'/item?id=' + encodeURIComponent(p?.['@id']) + '&_crateId=' + encodeURIComponent(p?.['@id'])">-->
      <!--          <el-button>{{ first(p?.name)?.['@value'] || p?.['@id'] }}</el-button>-->
      <!--        </a>-->
      <!--      </div>-->
      <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white" v-if="!Array.isArray(_memberOf)">
        &nbsp;In:&nbsp;
      </p>
      <div class="flex flex-wrap" v-if="!Array.isArray(_memberOf)">
        <a
            :href="'/collection?id=' + encodeURIComponent(root?.['@id']) + '&_crateId=' + encodeURIComponent(root?.['@id'])">
          <el-button>{{ first(first(root)?.name)?.['@value'] || first(root)?.['@id'] }}</el-button>
        </a>
      </div>
    </el-row>
    <el-row :align="'middle'" v-if="highlight">
      <ul>
        <li v-for="hl of highlight" v-html="'...' + first(hl) + '...'" class="p-2"></li>
      </ul>
    </el-row>
    <el-row class="py-4" v-if="first(details?.description)">
      <p>{{ first(details?.description)?.['@value'] }}</p>
    </el-row>
    <el-row v-if="types && types.includes('RepositoryCollection')">
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <SummariesCard :aggregations="aggregations" :fields="fields || []" :name="'summaries'" :id="id" :root="root"/>
      </el-col>
      <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12">
        <SummariesCard :aggregations="aggregations"
                       :fields="[{ 'name': 'license.name.@value', 'display': 'Data licenses for access' }]"
                       :name="'licenses'"
                       :id="id" :root="root"/>
        <div class="py-2">
          <div v-if="!isEmpty(subCollections)">
            <span class="font-semibold">Collections: </span>{{ subCollections?.total }}
          </div>
        </div>
        <div class="py-2">
          <span class="font-semibold">Objects: </span>{{ total }}
        </div>
        <div class="py-2" v-if="typeFile">
          <span class="font-semibold">Files: </span>{{ typeFile['doc_count'] }}
        </div>
        <div class="py-2">
          <el-link :underline="false"
                   :href="href">
            <el-button color="#626aef" size="large">More</el-button>
          </el-link>
        </div>
      </el-col>
    </el-row>
    <el-row v-if="score" class="pt-2">
      <div>
        <font-awesome-icon icon="fa-solid fa-5x fa-award"/> Search Score: {{ score }}
      </div>
    </el-row>
    <br/>
    <hr class="divide-y divide-gray-500"/>
  </div>
</template>
<script>
import {first, merge, toArray, isEmpty, find} from 'lodash';
import SummariesCard from './cards/SummariesCard.component.vue';

export default {
  components: {
    SummariesCard
  },
  props: ['id', 'href', 'name', 'conformsTo', 'types', 'languages', '_memberOf', 'root', 'highlight', 'parent', 'details', 'score'],
  data() {
    return {
      fields: this.$store.state.configuration.ui.main.fields || [],
      conformsToCollection: this.$store.state.configuration.ui.conformsTo?.collection,
      conformsToObject: this.$store.state.configuration.ui.conformsTo?.object,
      parentId: '',
      parentName: '',
      aggregations: this.$store.state.configuration.ui.aggregations,
      total: 0,
      members: [],
      typeFile: null,
      subCollections: []
    }
  },
  watch: {
    'types': {
      async handler() {
        await this.updateSummaries();
      },
      flush: 'post',
      immediate: true
    }
  },
  async mounted() {
    await this.updateSummaries();
  },
  async computed() {
    await this.updateSummaries();
  },
  methods: {
    first,
    toArray,
    isEmpty,
    getFilter({field, id}) {
      const filter = {};
      filter[field] = [id];
      let filterEncoded = encodeURIComponent(JSON.stringify(filter));
      if (this.$route.query.f) {
        filterEncoded = this.mergeQueryFilters({filters: this.$route.query.f, filter})
      }
      if (this.$route.query.q) {
        const searchQuery = `q=${this.$route.query.q}`;
        return `/search?${searchQuery}&f=${filterEncoded}`;
      } else {
        return `/search?f=${filterEncoded}`;
      }
    },
    mergeQueryFilters({filters, filter}) {
      let decodedFilters = decodeURIComponent(filters);
      decodedFilters = JSON.parse(decodedFilters);
      const merged = merge(decodedFilters, filter);
      return encodeURIComponent(JSON.stringify(merged));
    },
    async updateSummaries() {
      if (this.types && this.types.includes('RepositoryCollection')) {
        await this.summaries();
      }
    },
    async summaries() {
      this.loading = true;
      this.subCollections = await this.filter({
        '_memberOf.@id': [this.id],
        'conformsTo.@id': [this.conformsToCollection]
      });
      this.members = await this.filter({
        '_collectionStack.@id': [this.id],
        'conformsTo.@id': [this.conformsToObject]
      });
      const summaries = await this.filter({
        '_collectionStack.@id': [this.id]
      });
      this.aggregations = summaries?.aggregations;
      // Get the buckets to extract one value: File counts
      const buckets = summaries?.aggregations?.['@type']?.buckets;
      if (buckets) {
        this.typeFile = find(buckets, (obj) => obj.key === 'File');
      }
      this.total = this.members?.total;
      this.loading = false;
    },
    //TODO: refactor this integrate to multi
    async filter(filters) {
      const items = await this.$elasticService.multi({
        filters: filters,
        sort: 'relevance',
        order: 'desc'
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
