<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium">BinderHub Filter</h5>
    <hr class="divider divider-gray pt-2" />
    <div id="items-container">
      <div v-for="(item, index) in binderhubs" :key="index" class="item">
        <h3>{{ item.name }}</h3>
        <p>{{ item.description }}</p>
        <a :href="item.url">{{ item.url }}</a>
      </div>
    </div>

    <el-tooltip content="<span>The content can be <strong>HTML</strong></span>" raw-content>
      <el-text>Name</el-text>
    </el-tooltip>
  </el-card>

</template>

<script>
export default {
  mounted() {
    this.registryBinderhubs();
    console.log(this.binderhubs)
  },
  data() {
    return {
      binderhubs: []
    }
  },
  methods: {
    async registryBinderhubs() {
      let registryJson =
        "https://raw.githubusercontent.com/rosanna-smith/binderhub-test/main/testdata.json";
      const response = await fetch(registryJson);
      let binderhubData = await response.json();
      this.binderhubs = binderhubData.binderhubs

    },
  },
}
</script>
