<template>
  <el-row :offset="1" :gutter="10" :align="'bottom'" class="flex flex-wrap content-around p-3">
    <el-col class="h-auto">
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
        <p>Search in:</p>
        <el-button @click="showHelp = !showHelp"
                   class="cursor-pointer">
          Search Help&nbsp;<font-awesome-icon icon="fa fa-circle-question"/>
        </el-button>
      </el-row>
      <el-row class="p-2" :gutter="10" v-if="showHelp">
        <p>The information entered in the Advanced Search box(es) is treated as part of a 'mini-language'.</p>
        <ul class="px-2 list-disc list-inside">
          <li class="px-3 py-1">The query string is parsed into a series of terms and operators.</li>
          <li class="px-3 py-1">In general, the search functions are not case-sensitive. Exceptions to this are Boolean operators (see below).</li></ul>
        
        <p><b>Boolean Operators</b></p>
        <p>The standard Boolean operators <code class="literal backdrop-blur">AND</code>, <code class="literal backdrop-blur">OR</code> and <code class="literal backdrop-blur">NOT</code> are supported in advanced search. These can either be added in the dropdown menu when <i>Add New Line</i> is selected, or included within the search text field, but parentheses should be used whenever multiple operators occur together.</p>
        <p>For instance, to search for items that contain both 'public' and 'house' or 'government' and 'house' but not 'cottage', the query should be:</p>
        <p><code class="literal backdrop-blur">((public AND house) OR (government AND house)) NOT cottage</code></p>

        <p>To search for the literal words AND, OR and NOT, add a backward slash (<code class="literal backdrop-blur">\</code>) before that word to escape it, e.g. <code class="literal backdrop-blur">\OR</code>. Note that this is a situation where the search is case-sensitive; 'and' does not need to be escaped, but 'AND' does. Escaping will not return case-sensitive matches; it will just prevent its use as a Boolean operator.</p>

        <p><b>Query String Syntax</b></p>

        <table cellpadding = "2">
        <tbody>
        <tr>
        <td><b>Symbol</b></td>
        <td><b>Function</b></td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">" "</code></td>
        <td>Use double quotation marks before and after a phrase to search for that exact phrase, e.g. <code class="literal backdrop-blur">"public house"</code>. Searching for space in a phrasal search will also return entries where hyphen occurs instead.</td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">^</code></td>
        <td>Boost operator that makes one term more relevant than another, e.g. <code class="literal backdrop-blur">quick^2 fox</code></td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">~</code></td>
        <td>Creates a fuzzy query to return results similar to the search term by changing, removing, inserting or transposing one character. Can also be applied to phrase searches allowing the specified words to be further apart or in a different order. Add a number following this to increase the number of variations, e.g. <code class="literal backdrop-blur">brwn~2</code> and <code class="literal backdrop-blur">"house home"~3</code></td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">?</code></td>
        <td>Wildcard to replace zero or one of the previous character. Wildcards cannot be included in a phrase search.</td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">*</code></td>
        <td>Wildcard to replace zero or more of the previous character. Wildcards cannot be included in a phrase search.</td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">+</code></td>
        <td>Wildcard to replace one or more of the previous character. Wildcards cannot be included in a phrase search.</td>
        </tr>
        <tr>
        <td><code class="literal backdrop-blur">( )</code></td>
        <td>Defines a sub-expression.</td>
        </tr>
        </tbody>
        </table>
        <br>
        <p>The reserved characters are: <code class="literal backdrop-blur">+ - = && || > &lt; ! ( ) { } [ ] ^ " ~ * ? : \ /</code></p>

        <p><b>Regular Expressions</b></p>
        <p>Some regular expression patterns can be used within the query string by surrounding the pattern in forward slashes, e.g. <code class="literal backdrop-blur">/gr[ae]y/</code> or <code class="literal backdrop-blur">/honou*r/</code>. Currently, regular expressions can only be used for full-word searches and not phrases. This search engine does not support full Perl-compatible regex syntax, for more information see: <a title="RegExp Syntax" href="https://www.elastic.co/guide/en/elasticsearch/reference/current/regexp-syntax.html">RegExp Syntax</a>.</p>
          
          <!--<li class="px-3 py-1">A term can be a single word -- 'quick' or 'brown' -- or a phrase, surrounded by double
            quotes -- "quick brown" -- which searches for all the words in the phrase, in the same order. NB: In the
            Basic Search box, multi-word expressions are treated as being linked by OR regardless of whether they have
            quote marks around them.
          </li>
          <li class="px-3 py-1">Wildcard searches can be run on terms consisting of a single word, using ? to replace a
            single character, and * to replace zero or more characters. Wildcards cannot be included in a phrase search.
          </li>
          <li class="px-3 py-1">Regular expression patterns can be embedded in the query string by wrapping them in
            forward-slashes ("/"). This search engine does not support full Perl-compatible regex syntax, for more see:
            <a target="_blank" rel="noopener noreferrer" class="underline text-blue-300" href="https://www.elastic.co/guide/en/elasticsearch/reference/current/regexp-syntax.html">RegExp Syntax</a>.
          </li>
          <li class="px-3 py-1">The reserved characters are: <code class="literal backdrop-blur">+ - = && || > &lt; ! (
            ) { } [ ] ^ " ~ * ? : \ /</code></li>
          <li class="px-3 py-1">Reserved characters should be escaped using a back-slash ("\"). Failing to escape these
            special characters correctly could lead to a syntax error which prevents your query from running. For
            example, to search for 'LGBTQ+', you would need to enter the string 'LGBTQ\+'.
          </li>
<!--          <li class="px-3 py-1">The familiar boolean operators AND, OR and NOT (also written &&, || and !) are also-->
<!--            supported but beware that they do not honor the usual precedence rules, so parentheses should be used-->
<!--            whenever multiple operators are used together. For instance, to search for files which contain both 'public'-->
<!--            and 'house' or 'government' and 'house' or 'house' but not 'cottage', the query should be ((public AND-->
<!--            house) OR (government AND house) OR house) AND NOT cottage-->
<!--          </li>-->
<!--          <li class="px-3 py-1">If you search for the literal word AND, OR, and NOT they all should be escaped. eg. \OR.-->
<!--            Note that this is a situation where the search is case sensitive: 'and' does not need to be escaped, but-->
<!--            'AND' does.-->
<!--          </li>-->
          <!--          <li class="px-3 py-1">Clicking on "Use Query String" will show you the actual search string used for your search. You can update your search string however it will not convert back to the search box</li>-->
        <!--</ul>-->
      </el-row>
      <el-row class="px-2 pb-2" :gutter="10" v-for="(sg, index) in searchGroup" :key="index">
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
            disabled
        />
      </el-row>
      <el-row class="p-2" :gutter="10" :justify="'space-between'">
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
        <el-tooltip class="box-item" effect="light" trigger="hover" content="This query string is what it is actually sent to the search engine, click search to update it"
                    placement="bottom-end">
          <el-button @click="doUseQueryString()">
            {{ useQueryString ? 'Hide Query' : 'Show Query' }}&nbsp;
            <font-awesome-icon icon="fa-solid fa-circle-info"/>
          </el-button>
        </el-tooltip>
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
      this.setQueryString();
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
    },
    setQueryString() {
      this.textQueryString = this.$elasticService.queryString(this.searchGroup);
      this.queries = {
        queryString: this.textQueryString,
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
