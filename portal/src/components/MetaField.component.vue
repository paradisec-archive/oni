<template>
  <el-row :gutter="10" class="py-2">
    <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">
      <span class="font-bold break-words break-all">{{ clean(meta?.name) }}</span>
      <span v-if="meta?.help"><FieldHelperCard :meta="meta?.help"/></span>
    </el-col>
    <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
      <template v-if="Array.isArray(meta?.data)">
        <ul v-for="d of meta.data">
          <li>
            <elastic-field :field="d" :title="meta?.name"/>
          </li>
        </ul>
      </template>
      <template v-else>
        <elastic-resolve-field :name="meta?.name" :field="meta?.data" :routePath="routePath" :filePath="filePath" :parentId="parentId" :crateId="crateId"/>
      </template>
    </el-col>
  </el-row>
</template>
<script>
import {first} from "lodash";
import ElasticField from "./ElasticField.component.vue";
import ElasticResolveField from "./ElasticResolveField.component.vue";
import FieldHelperCard from "./cards/FieldHelperCard.component.vue";

export default {
  components: {
    FieldHelperCard,
    ElasticField,
    ElasticResolveField
  },
  props: ['meta', 'routePath', 'filePath', 'parentId', 'crateId'],
  data() {
    return {}
  },
  async mounted() {
    try {

    } catch (e) {
      console.error(e)
    }
  },
  methods: {
    first,
    clean(text) {
      if (text) {
        return this.capitalizeFirstLetter(text.replace(/([a-z])([A-Z])/g, '$1 $2'));
      }
    },
    capitalizeFirstLetter(string) {
      return string[0].toUpperCase() + string.slice(1);
    }
  }
}
</script>
