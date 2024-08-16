<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5">
    <h5 class="text-2xl font-medium">BinderHub Filter</h5>
    <hr class="divider divider-gray pt-2" />
    <div v-for="(item, index) in binderhubs" :key="index" class="item">
      <el-row>
        <el-col :span="15">
          <br>
          <el-tooltip :content="item.description" placement="left">
            <el-text>{{ item.name }}</el-text>
          </el-tooltip>
        </el-col>
        <el-col :span="1">
          <br>
          <a :href="generateUrl(item.url)" target="_blank" rel="noopener noreferrer">
            <manku-icon name="binderLink" height="25" fill="blue" />
            <!-- <el-text>{{ gitName }}</el-text>
            <el-text>{{ gitOrg }}</el-text>
            <el-text>{{ gitBranch }}</el-text>
            <el-text>{{ filepath }}</el-text> -->
          </a>
        </el-col>
      </el-row>
    </div>
  </el-card>
</template>

<script>

import binderhubconfiguration from '@/binderhubconfiguration.json';
import { first } from "lodash";

export default {
  props: ['gitOrg', 'gitName', 'gitBranch', 'filepath'],
  mounted() {
    this.registryBinderhubs();
    this.notebookLink();
    this.generateUrl();
  },
  data() {
    return {
      binderhubs: [],
    };
  },

  methods: {
    async registryBinderhubs() {
      const githubToken = binderhubconfiguration.githubToken;
      if (!githubToken) {
        console.error('GitHub token is missing.');
        return;
      }
      let registryJson =
        "https://api.github.com/repos/Language-Research-Technology/BinderHub-registry/contents/BinderHub-registry.json";
      const response = await fetch(registryJson, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.raw+json'
        }
      });
      let binderhubData = await response.json();
      this.binderhubs = binderhubData.binderhubs;
    },
    notebookLink() {
      let notebookPath = `${first(this.gitOrg)?.['@value']}/${first(this.gitName)?.['@value']}/${first(this.gitBranch)?.['@value']}?filepath=${first(this.filepath)?.['@id']}`;
      console.log(typeof notebookPath)
      return notebookPath
    },
    generateUrl(baseUrl) {
      return `${baseUrl}/${this.notebookLink()}`;
    },
  },
};
</script>
