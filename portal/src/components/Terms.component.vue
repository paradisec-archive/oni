<template>
  <div class="min-w-full pb-4 pt-0 px-2 pl-4">
    <div class="bg-white z-10">
    </div>
    <el-row :gutter="40" :offset="1" class="p-4">
      <p class="text-gray-500 mb-6"></p>
      <div class="text-sm grid-cols-1 lg:grid-cols-3">
        <div class="text-gray-600">
          <div class="p-2">
            <p class="font-medium text-2xl">{{ terms.title }}</p>
          </div>
          <div class="p-2">
            <p class="font-medium text-lg" v-html="terms.text"></p>
          </div>
        </div>
      </div>
    </el-row>
  </div>
</template>

<script>

export default {
  data() {
    return {
      terms: this.$store.state.configuration.ui.terms,
    }
  },
  mounted() {
  }
};
</script>
