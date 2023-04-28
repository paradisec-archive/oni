<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around">
    <el-col :xs="24" class="h-auto">
      <el-row :justify="'center'" :gutter="10" :align="'middle'" class="">
        <label for="searchInput" class="h-14 mx-2 my-1 w-full">
          <el-input @keyup.enter="searchInputField" type="text" class="px-2 w-64 h-full w-full"
                    placeholder="Search..."
                    v-model="searchQuery"
                    v-on:change="searchInputField"
                    name="searchInput" id="searchInput" ref="searchInput">
            <template #append>
              <button v-if="searchInput || $route.query.q" @click="resetBar()"
                      class="flex items-center justify-center pr-3 hover:text-red-600 mr-3 border-0 border-r-[1px] border-solid border-gray-300">
                <svg class="svg-icon"
                     style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;"
                     viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                  <path
                      d="M810.65984 170.65984q18.3296 0 30.49472 12.16512t12.16512 30.49472q0 18.00192-12.32896 30.33088l-268.67712 268.32896 268.67712 268.32896q12.32896 12.32896 12.32896 30.33088 0 18.3296-12.16512 30.49472t-30.49472 12.16512q-18.00192 0-30.33088-12.32896l-268.32896-268.67712-268.32896 268.67712q-12.32896 12.32896-30.33088 12.32896-18.3296 0-30.49472-12.16512t-12.16512-30.49472q0-18.00192 12.32896-30.33088l268.67712-268.32896-268.67712-268.32896q-12.32896-12.32896-12.32896-30.33088 0-18.3296 12.16512-30.49472t30.49472-12.16512q18.00192 0 30.33088 12.32896l268.32896 268.67712 268.32896-268.67712q12.32896-12.32896 30.33088-12.32896z"/>
                </svg>
              </button>
              <button @click="doSearch()" class="flex items-center justify-center rounded hover:text-red-600 my-1">
                <!--          text-gray-600"-->
                <svg class="svg-icon"
                     style="width: 2em; height: 2em;vertical-align: middle;fill: currentColor;overflow: hidden;"
                     fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24">
                  <path
                      d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                </svg>
              </button>
            </template>
          </el-input>
        </label>
      </el-row>
      <el-row v-if="showFields" :justify="'center'" :gutter="20" :align="'middle'" class="p-2">
        <el-button :text="true" link @click="showFieldSearch=!showFieldSearch"
                   class="cursor-pointer">
          {{ showFieldSearch ? 'hide fields' : 'show fields included in search' }}
        </el-button>
      </el-row>
      <el-row v-show="showFieldSearch"
              :justify="'center'" :gutter="20" :align="'middle'" class="">
        <p class="mx-2 px-2 break-all">Selecting a field will limit the search</p>
      </el-row>
      <el-row v-show="showFieldSearch"
              :justify="'start'" :gutter="20" :align="'middle'"
              v-for="(value, name) of searchFields" :key="name">
        <div class="mx-2 min-w-300">
          <el-checkbox class="px-3 mx-2.5 break-all"
                       @change="fieldSelected(name, $event)"
                       :label="value.label || value.name" size="large"
                       :checked="value.selected"/>
        </div>
      </el-row>
      <el-row v-show="showFieldSearch"
              :justify="'space-around'" :gutter="20" :align="'middle'">
        <el-radio-group class="mx-2 px-2 break-all" v-model="operator">
          <el-radio :label="'must'">And</el-radio>
          <el-radio :label="'should'">Or</el-radio>
          <el-radio :label="'must_not'">Not</el-radio>
        </el-radio-group>
      </el-row>
    </el-col>
  </el-row>
</template>

<script>

import {defineAsyncComponent} from 'vue';
import {Close} from '@element-plus/icons-vue'
import {isEmpty} from 'lodash';

export default {
  props: ['searchInput', 'clearSearch', 'filters', 'search', 'fields' , 'showFields'],
  components: {},
  updated() {
  },
  created() {
    this.searchFields = this.fields;
  },
  async mounted() {
    if (this.$route.query.q) {
      this.searchQuery = this.$route.query.q;
    }
    if (this.$route.query.sf) {
      this.showFieldSearch = true;
    }
    if (this.$route.query.o) {
      this.operator = this.$route.query.o;
    }
  },
  watch: {
    '$route.query.o'() {
      this.operator = this.$route.query.o;
    },
    '$route.query.q'() {
      this.searchQuery = this.$route.query.q;
    },
    '$route.query.sf'() {
      const sf = decodeURIComponent(this.$route.query.sf) || null;
      if (!isEmpty(sf)) {
        this.showFieldSearch = true;
        try {
          this.searchFields = JSON.parse(sf);
        } catch (e) {
          this.searchFields = null;
        }
      } else {
        this.searchFields = null;
      }
    },
    clearSearch() {
      this.reset();
    }
  },
  methods: {
    isEmpty,
    async reset() {
      this.searchQuery = '';
      await this.$router.push({path: 'search'});
    },
    async resetBar() {
      this.searchQuery = '';
      let query = {q: this.searchQuery, o: this.operator};
      if (this.$route.query.f) {
        console.log(this.$route.query.f);
        query = {...query, f: this.$route.query.f};
      }
      await this.$router.push({path: 'search', query});
    },
    async searchInputField(e) {
      if (typeof e === 'string') {
        this.searchQuery = e;
      } else {
        this.searchQuery = e.target?.value;
      }
      await this.doSearch();
    },
    async doSearch() {
      let query = {
        q: this.searchQuery,
        o: this.operator
      };
      let sf;
      if (!isEmpty(this.searchFields)) {
        sf = encodeURIComponent(JSON.stringify(this.searchFields))
      }
      if (sf) {
        query = {...query, sf}
      }
      if (this.$route.query.f) {
        query = {...query, f: this.$route.query.f};
      }
      await this.$router.push({path: 'search', query});
    },
    async fieldSelected(field, event) {
      this.searchFields[field]['selected'] = event;
    }
  },
  data() {
    return {
      siteName: this.$store.state.configuration.ui.siteName,
      siteNameX: this.$store.state.configuration.ui.siteNameX || '',
      searchQuery: '',
      items: [],
      scrollId: '',
      searchFields: [],
      showFieldSearch: false,
      operator: 'should'
    }
  }
}
</script>
