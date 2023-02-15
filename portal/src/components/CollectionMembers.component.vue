<template>
  <el-row>
    <el-col :span="24" class="divide-solid divide-y-2 divide-red-700">
      <div class="grid-content p-6">
        <h5 class="mb-2 text-2xl tracking-tight dark:text-white">
          {{ title }}: {{ items.total }}
        </h5>
      </div>
      <div></div>
    </el-col>
  </el-row>
  <el-row class="p-10">
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
      <template v-if="Array.isArray(items.aggregations)">
        <ul v-for="(index, d) of items.aggregations">
          <li>{{ d._source }}</li>
        </ul>
      </template>
      <template v-else>{{ items.data?._source }}</template>
    </el-col>
    <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
      <template v-if="Array.isArray(items.data)">
        <ul v-for="d of items.data">
          <li>
            <collection-item :field="d._source" :routePath="routePath" />
          </li>
        </ul>
      </template>
      <template v-else>
        <elastic-resolve-field :field="items.data?._source" />
      </template>
    </el-col>
    <el-col>
      <el-row class="py-2" v-if="continueScroll">
        <el-button @click="scroll">load more...</el-button>
      </el-row>
    </el-col>
  </el-row>
  <el-dialog v-model="errorScroll" width="30%" center>
      <el-alert title="Error" type="warning" :closable="false">
        <p class="break-normal">Your session has expired, please reload the page</p>
      </el-alert>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="$router.go(0)">Reload</el-button>
        </span>
      </template>
    </el-dialog>
</template>
<script>
import { first } from "lodash";
import CollectionItem from "./CollectionItem.component.vue";
import ElasticResolveField from "./ElasticResolveField.component.vue";

export default {
  components: {
    CollectionItem,
    ElasticResolveField
  },
  props: ['title', 'members', 'routePath'],
  data() {
    return {
      items: [],
      continueScroll: '',
      errorScroll: false
    }
  },
  mounted() {
    this.setMembers();
  },
  updated() {
    this.setMembers();
  },
  watch: {},
  methods: {
    first,
    setMembers() {
      this.items = this.members;
      if (this.items?.data?.length < this.members.total) {
        this.continueScroll = this.members.scrollId;
      }
    },
    async scroll() {
      try {
        this.errorScroll = false;
        const items = await this.$elasticService.scroll(this.continueScroll);
        const thisItems = items?.['hits']?.['hits'];
        this.items.data = this.items.data.concat(thisItems);
        this.continueScroll = this.items.data.length < this.members.total ? items?._scroll_id : undefined;
      } catch (e) {
        this.errorScroll = true;
      }

    }
  }
}
</script>
