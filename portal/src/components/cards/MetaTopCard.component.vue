<template>
  <el-row v-for="field of tops" :class="className">
    <el-col :xs="24" :sm="24" :md="7" :lg="7" :xl="7">
      <p class="font-bold">
        {{ field.name }}
      </p>
    </el-col>
    <el-col :xs="24" :sm="24" :md="17" :lg="17" :xl="17">
      <p>{{ first(field.value)?.['@value'] }}</p>
    </el-col>
  </el-row>
</template>
<script>
import FieldHelperCard from './FieldHelperCard.component.vue';
import {first} from "lodash";

export default {
  components: {
    FieldHelperCard,
  },
  props: ['tops', 'elasticField', 'className'],
  data() {
    return {}
  },
  mounted() {
    console.log(this.elasticField)
  },
  methods: {first}
}
</script>
