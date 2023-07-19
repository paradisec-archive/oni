<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col :xs="4" class="h-auto">
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <p>Search in:</p>
        <el-button @click="showHelp = !showHelp"
                   class="cursor-pointer">
          <font-awesome-icon icon="fa fa-question"/>&nbsp;Help
        </el-button>
      </el-row>
      <el-row class="p-2" :gutter="10" v-if="showHelp">
        <p>Bellow a query string "mini-language" is used</p>
        <ul class="px-2 list-disc list-inside">
          <li class="px-3 py-1">The query string is parsed into a series of terms and operators. A term can be a single
            word -- quick or
            brown -- or a phrase, surrounded by double quotes -- "quick brown" -- which searches for all the words in
            the phrase, in the same order.
          </li>
          <li class="px-3 py-1">Wildcard searches can be run on individual terms, using ? to replace a single character,
            and * to replace
            zero or more characters
          </li>
          <li class="px-3 py-1">Regular expression patterns can be embedded in the query string by wrapping them in
            forward-slashes
            ("/"):
          </li>
          <li class="px-3 py-1">The reserved characters are: <code class="literal backdrop-blur">+ - = &amp;&amp; ||
            &gt; &lt; ! ( ) { } [ ] ^ " ~ * ? :
            \ /</code>&nbsp;Failing to escape these
            special characters correctly could lead to a syntax error which prevents your query from running.
          </li>
          <li class="px-3 py-1">The familiar boolean operators AND, OR and NOT (also written &&, || and !) are also
            supported but beware
            that they do not honor the usual precedence rules, so parentheses should be used whenever multiple operators
            are used together. For instance the previous query could be rewritten as:
            <code class="literal">((quick AND fox) OR (brown AND fox) OR fox) AND NOT news</code>
          </li>
          <li class="px-3 py-1">If you search for the literal word AND, OR, and NOT they all should be escaped. eg.
            \OR
          </li>
          <li class="px-3 py-1">Clicking on "Use Query String" will show you the actual search string used for your
            search.
            You can update your search string however it will not convert back to the search box
          </li>
        </ul>
      </el-row>
      <el-row v-if="!useQueryString" class="px-2 pb-2" :gutter="10" v-for="(sg, index) in searchGroup" :key="index">
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8" class="h-auto">
          <el-select class="w-full m-2"
                     placeholder="Select a Field"
                     :default-first-option="true"
                     v-model="sg.field"
                     @change="sg.field === 'all_fields' || sg.field === '@id' ? sg.type= 'phrase' : sg.type">
            <el-option v-for="field in fieldAdvancedSearch"
                       :key="field.value"
                       :label="field.label"
                       :value="field.value">
            </el-option>
          </el-select>
        </el-col>
        <!--        <el-col :xs="24" :sm="24" :md="5" :lg="5" :xl="5" class="h-auto">-->
        <!--          <el-select class="w-full m-2"-->
        <!--                     v-model="sg.type"-->
        <!--                     :default-first-option="true">-->
        <!--            <el-option label="match" value="phrase"/>-->
        <!--            <el-option label="prefix" value="phrase_prefix"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--            <el-option label="wildcard" value="wildcard"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--            <el-option label="regex" value="regex"-->
        <!--                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>-->
        <!--          </el-select>-->
        <!--        </el-col>-->
        <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" class="h-auto">
          <el-input class="w-full m-2" v-model="sg.searchInput"/>
        </el-col>
        <el-col :xs="24" :sm="24" :md="1" :lg="1" :xl="1" class="h-auto">
          <el-button v-show="searchGroup.length > 1" class="w-full m-2" type="warning" @click="removeLine(index)">
            <font-awesome-icon icon="fa fa-minus"/>
          </el-button>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="h-auto">
          <el-select v-if="index < searchGroup.length - 1" class="w-20 m-2 mt-4"
                     v-model="sg.operation"
                     :default-first-option="true">
            <el-option label="AND" value="AND"/>
            <el-option label="OR" value="OR"/>
            <el-option label="NOT" value="NOT"/>
          </el-select>
        </el-col>
      </el-row>
      <el-row v-if="useQueryString" class="p-2" :gutter="10" :justify="'start'">
        <el-input
            v-model="textQueryString"
            :rows="2"
            type="textarea"
            :autosize="true"
            placeholder="name.@value: (market) AND name.@value: (forces)"
        />
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <el-button-group v-if="!useQueryString">
          <el-button @click="addNewLine"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-plus"/>&nbsp;Add New Line
          </el-button>
          <el-button @click="clear"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-rotate-left"/>&nbsp;Clear
          </el-button>
        </el-button-group>
        <el-button @click="doUseQueryString">
          {{ useQueryString ? 'Use Box Search' : 'Use Query String' }}
        </el-button>
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'center'">
        <el-button @click="advancedSearch"
                   type="primary"
                   size="large"
                   class="cursor-pointer">
          <span class="text-xl">Search &nbsp;<font-awesome-icon icon="fa fa-search"/></span>
        </el-button>
      </el-row>
      <el-row class="p-2" :justify="'start'" :gutter="10" :align="'middle'">
        <el-button @click="showBasicSearch"
                   class="cursor-pointer">Switch to basic search
        </el-button>
      </el-row>

    </el-col>
  </el-row>
</template>

<script>

import {defineAsyncComponent} from 'vue';
import {Close} from '@element-plus/icons-vue'
import {isEmpty} from 'lodash';
import {getLocalStorage, removeLocalStorage} from '@/storage';

export default {
  props: ['searchInput', 'fields', 'resetAdvancedSearch'],
  components: {},
  created() {
  },
  updated() {
    if (this.resetAdvancedSearch) {
      this.searchGroup = [{
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: ''
      }];
    }
  },
  computed: {},
  async mounted() {
    if (this.$route.query.a) {
      this.advancedSearch = true;
      let searchGroup = JSON.parse(decodeURIComponent(this.$route.query.a));
      this.searchGroup = searchGroup;
    }
  },
  watch: {},
  methods: {
    isEmpty,
    advancedSearch() {
      if (this.useQueryString) {
        this.queries = {
          queryString: this.textQueryString,
          searchGroup: encodeURIComponent(JSON.stringify(this.searchGroup))
        }
      } else {
        this.setQueryString();
      }
      this.$emit('doAdvancedSearch', {queries: this.queries});
    },
    addNewLine() {
      this.searchGroup.push({
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: ''
      });
    },
    clear() {
      this.searchGroup = [{
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: ''
      }];
    },
    removeLine(index) {
      this.searchGroup.splice(index, 1);
    },
    showBasicSearch() {
      removeLocalStorage({key: 'advancedQueries'});
      this.searchGroup = [{
        field: 'all_fields',
        operation: 'AND',
        operator: 'AND',
        type: 'phrase',
        searchInput: ''
      }];
      this.$emit('basic-search');
    },
    doUseQueryString() {
      this.useQueryString = !this.useQueryString;
      this.setQueryString();
      this.textQueryString = this.queries.queryString;
    },
    setQueryString() {
      let queryString = this.$elasticService.queryString(this.searchGroup);
      this.queries = {
        queryString: queryString,
        searchGroup: encodeURIComponent(JSON.stringify(this.searchGroup))
      }
    }
  },
  data() {
    const fieldAdvancedSearch = [{label: 'All Fields', value: 'all_fields'}];
    Object.keys(this.fields).map((f) => {
      fieldAdvancedSearch.push({label: this.fields[f].label, value: f})
    });
    const searchGroup = [{
      field: 'all_fields',
      operation: 'AND',
      operator: 'AND',
      type: 'phrase',
      searchInput: ''
    }]
    // searchGroup.push();
    return {
      searchGroup: searchGroup,
      selectedField: {},
      selectedOperation: 'AND',
      fieldAdvancedSearch: fieldAdvancedSearch,
      useQueryString: false,
      queries: '',
      textQueryString: '',
      showHelp: false
    }
  }
}
</script>
