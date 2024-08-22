<template>
  <el-card :body-style="{ padding: '0px' }" class="mx-10 p-5" v-if="this.registryJson && this.gitName">
    <h5 class="text-2xl font-medium">BinderHub Filter</h5>
    <hr class="divider divider-gray pt-2" />
    <div v-for="(item, index) in binderhubs" :key="index" class="item">
      <el-row justify="space-between" align="middle">
        <el-col :span="13">
          <br>
          <el-tooltip :content="item.description" placement="left">
            <el-text>{{ item.name }}</el-text>
          </el-tooltip>
        </el-col>
        <el-col :span="9.5">
          <br>
          <a :href="generateUrl(item.url)" target="_blank" rel="noopener noreferrer">
            <manku-icon name="binderLink" height="25" fill="blue" />
          </a>
        </el-col>
        <el-col :span="1" fixed="right">
          <br>
          <el-tooltip :content="authenticationTooltip(item.authentication)" placement="right">
            <font-awesome-icon :icon="trafficIcon(item.authentication)" size="lg"
              :style="trafficStyle(item.authentication)" />
          </el-tooltip>
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
    this.authenticationTooltip();
    // this.memoryTooltip();
    this.trafficIcon();
    this.trafficStyle()
  },
  data() {
    return {
      binderhubs: [],
      registryJson: this.$store.state.configuration.ui.binderhubRegistry?.registryJson
    };
  },

  methods: {
    async registryBinderhubs() {
      const githubToken = binderhubconfiguration.githubToken;
      if (!githubToken) {
        console.error('GitHub token is missing.');
        return;
      }
      const response = await fetch(this.registryJson, {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.raw+json'
        }
      });
      let binderhubData = await response.json();
      this.binderhubs = binderhubData.binderhubs;
    },
    notebookLink() {
      let notebookPath = `v2/gh/${first(this.gitOrg)?.['@value']}/${first(this.gitName)?.['@value']}/${first(this.gitBranch)?.['@value']}?filepath=${first(this.filepath)?.['@id']}`;
      return notebookPath
    },
    generateUrl(baseUrl) {
      return `${baseUrl}/${this.notebookLink()}`;
    },
    authenticationTooltip(element) {
      if (element) {
        return 'Access: Authentication required.';
      } else {
        return 'Access: Authentication not required.';
      }
    },
    // memoryTooltip(current, required) {
    //   if (current < required) {
    //     return `Insufficient memory: Only ${current} of ${required}GB provided.`;
    //   } else {
    //     return `Sufficient memory: ${current} of ${required}GB provided.`; //can add to template: + memoryTooltip(item.resources.memory.limit, 100)
    //   }
    // },
    trafficIcon(element) {
      if (element) {
        return 'fa-solid fa-circle-exclamation';
      } else {
        return 'fa-solid fa-circle-check';
      }
    },
    trafficStyle(element) {
      if (element) {
        return 'color: #FFD43B;';
      } else {
        return 'color: #51c09f';
      }
    }
  },
};
</script>
