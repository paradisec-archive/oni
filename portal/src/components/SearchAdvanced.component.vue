<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col :xs="4" class="h-auto">
      <el-row class="p-2" :gutter="10">
        <p>Search in:</p>
      </el-row>
      <el-row class="px-2 pb-2" :gutter="10" v-for="(sg, index) in searchGroup" :key="index">
        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" class="h-auto">
          <el-select v-if="index>0" class="w-20 mx-2 mb-2"
                     v-model="sg.operation"
                     :default-first-option="true">
            <el-option label="AND" value="must"/>
            <el-option label="OR" value="should"/>
            <el-option label="NOT" value="must_not"/>
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="5" :lg="5" :xl="5" class="h-auto">
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
        <!--        <el-col :xs="24" :sm="24" :md="3" :lg="3" :xl="3" class="h-auto">-->
        <!--          <el-select class="w-full m-2"-->
        <!--                     v-model="sg.operation"-->
        <!--                     :default-first-option="true">-->
        <!--            <el-option label="must" value="must"/>-->
        <!--            <el-option label="should" value="should"/>-->
        <!--            <el-option label="must not" value="must_not"/>-->
        <!--          </el-select>-->
        <!--        </el-col>-->
        <el-col :xs="24" :sm="24" :md="5" :lg="5" :xl="5" class="h-auto">
          <el-select class="w-full m-2"
                     v-model="sg.type"
                     :default-first-option="true">
            <el-option label="match" value="phrase"/>
            <el-option label="prefix" value="phrase_prefix"
                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>
            <el-option label="wildcard" value="wildcard"
                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>
            <el-option label="regex" value="regex"
                       :disabled="sg.field === 'all_fields' || sg.field === '@id' "/>
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" class="h-auto">
          <el-input class="w-full m-2" v-model="sg.searchInput"/>
        </el-col>
        <el-col :xs="24" :sm="24" :md="1" :lg="1" :xl="1" class="h-auto">
          <el-button v-show="searchGroup.length > 1" class="w-full m-2" type="warning" @click="removeLine(index)">
            <font-awesome-icon icon="fa fa-minus"/>
          </el-button>
        </el-col>

      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'start'">
        <el-button-group>
          <el-button @click="addNewLine"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-plus"/>&nbsp;Add New Line
          </el-button>
          <el-button @click="clear"
                     class="cursor-pointer">
            <font-awesome-icon icon="fa fa-rotate-left"/>&nbsp;Clear
          </el-button>
        </el-button-group>
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
        operation: 'must',
        operator: 'must',
        type: 'phrase',
        searchInput: ''
      }];
    }
  },
  computed: {},
  async mounted() {
    if (this.$route.query.a) {
      this.advancedSearch = true;
      let advancedQueries = getLocalStorage({key: 'advancedQueries'});
      this.advancedQueries = advancedQueries;
    }
    if (this.advancedQueries) {
      this.searchGroup = [];
      for (let sg of this.advancedQueries) {
        const searchGroup = {};
        if (sg.multiField) {
          searchGroup.field = 'all_fields';
          searchGroup.fields = Object.keys(this.fields).map((f) => f);
        } else {
          searchGroup.field = sg.fields[0];
          searchGroup.fields = sg.fields;
        }
        searchGroup.operation = sg.operation;
        searchGroup.operator = sg.operator;
        searchGroup.searchInput = sg.query;
        searchGroup.type = sg.type;
        this.searchGroup.push(searchGroup);
      }
    }
  },
  watch: {},
  methods: {
    isEmpty,
    advancedSearch() {
      const queries = [];
      this.searchGroup.forEach((sg, i) => {
        let fields;
        if (sg.field === 'all_fields') {
          fields = Object.keys(this.fields).map((f) => f);
        } else {
          fields = [sg.field];
        }
        if (i === 0) {
          sg.operation = 'must'
        }
        queries.push({
          multiField: sg.field === 'all_fields',
          fields: fields, // This can have multiple values
          operator: sg.operator,
          operation: sg.operation,
          type: sg.type,
          query: sg.searchInput
        });
      });
      this.$emit('doAdvancedSearch', queries);
    },
    addNewLine() {
      this.searchGroup.push({
        field: 'all_fields',
        operation: 'must',
        operator: 'must',
        type: 'phrase',
        searchInput: ''
      });
    },
    clear() {
      this.searchGroup = [{
        field: 'all_fields',
        operation: 'must',
        operator: 'must',
        type: 'phrase',
        searchInput: ''
      }];
    },
    removeLine(index) {
      this.searchGroup.splice(index, 1)
    },
    showBasicSearch() {
      removeLocalStorage({key: 'advancedQueries'});
      this.searchGroup = [{
        field: 'all_fields',
        operation: 'must',
        operator: 'must',
        type: 'phrase',
        searchInput: ''
      }];
      this.$emit('basic-search');
    }
  },
  data() {
    const fieldAdvancedSearch = [{label: 'All Fields', value: 'all_fields'}];
    Object.keys(this.fields).map((f) => {
      fieldAdvancedSearch.push({label: this.fields[f].label, value: f})
    });
    const searchGroup = [{
      field: 'all_fields',
      operation: 'must',
      operator: 'and',
      type: 'phrase',
      searchInput: ''
    }]
    // searchGroup.push();
    return {
      searchGroup: searchGroup,
      selectedField: {},
      selectedOperation: 'must',
      fieldAdvancedSearch: fieldAdvancedSearch
    }
  }
}
</script>
