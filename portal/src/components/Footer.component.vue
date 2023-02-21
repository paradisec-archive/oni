<template>
  <div class="h-28 text-center bg-gray-50 grid place-items-center ">
    <el-row>
      <el-col :span="24">
        <span>{{ copyright }}</span>&nbsp;
        <a class="text-gray-600 font-semibold" :href="href">{{ hrefText }}</a>
      </el-col>
    </el-row>
    <el-row v-if="terms">
      <el-col :span="24">
        <a class="text-gray-600 font-semibold" :href="terms.href">{{ terms.title }}</a>
      </el-col>
    </el-row>
  </div>
</template>
<script>
export default {
  name: 'FooterView',
  data() {
    return {
      copyright: this.$store.state.configuration.ui.footer.copyright,
      href: this.$store.state.configuration.ui.footer.link.href,
      hrefText: this.$store.state.configuration.ui.footer.link.text,
      terms: this.$store.state.configuration.ui?.terms
    }
  }
}
</script>
