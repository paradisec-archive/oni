<template>
  <el-menu
      mode="horizontal"
      :ellipsis="false"
      :default-active="active"
      :router="true"
  >
    <el-menu-item index="home" :route="topNavHome">
      <router-link :to="topNavHome">
        <el-row :gutter="10" class="flex items-center justify-center min-w-md">
          <el-col :span="4">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <span>Home</span>
            </div>
          </el-col>
          <el-col :span="18">
          <span class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
            <img v-if="showLogo" class="object-fill block" :src="logo" :srcset="logo" :style="{'height': navHeight}"
                 :alt="this.$store.state.configuration.ui.shortTitle || 'Oni'"/>
            <span v-else link>{{ this.$store.state.configuration.ui.shortTitle || 'Oni' }}</span>
          </span>
          </el-col>
        </el-row>
      </router-link>
    </el-menu-item>
    <div class="flex-grow"/>
    <div index="searchBar" v-if="$route.name!='search'" :route="'false'">
      <div class="py-2">
      <search-bar ref='searchBar' @populate='populate' v-bind:searchInput="searchInput" @input="onInputChange"
                  @search="search" :clearSearch="clear" :filters="this.filters"/>
      </div>
    </div>
    <el-menu-item v-for="topNavItem of topNavItems" :index="topNavItem.route" :router="topNavItem.route">
      <router-link :to="topNavItem.route">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <span>{{ topNavItem.display }}</span>
            </div>
          </el-col>
        </el-row>
      </router-link>
    </el-menu-item>
    <el-menu-item index="search" :route="'/search'">
      <router-link to="/search">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <span>Browse</span>
            </div>
          </el-col>
        </el-row>
      </router-link>
    </el-menu-item >
    <el-menu-item index="help" :route="'/help'">
      <router-link to="/help">
        <el-row :gutter="10" class="flex items-center justify-center">
          <el-col :span="24">
            <div class="flex flex-col justify-center items-center" :style="{'height': navHeight}">
              <span>Help</span>
            </div>
          </el-col>
        </el-row>
      </router-link>
    </el-menu-item>
    <nav-user v-if="isLoginEnabled"/>
  </el-menu>
</template>
<script>

import {
  tokenSessionKey,
  removeLocalStorage,
  getLocalStorage
} from "@/storage";
import NavUser from './NavUser.component.vue';
import logo from "@/assets/logo.svg";
import {defineAsyncComponent, toRaw} from "vue";

export default {
  name: 'NavView',
  components: {
    NavUser,
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    )
  },
  data() {
    return {
      isLoginEnabled: this.$store.state.configuration.ui?.login?.enabled,
      showLogo: this.$store.state.configuration.ui?.showLogo,
      showNotebooks: this.$store.state.configuration.ui?.showNotebooks,
      navHeight: this.$store.state.configuration.ui?.navHeight || '50px',
      topNavHome: this.$store.state.configuration.ui?.topNavHome || '/search',
      topNavItems: this.$store.state.configuration.ui?.topNavItems || [],
      logo,
      active: '',
      populate: null,
      searchInput: null,
      search: null,
      clear: null,
      filters: null,
      onInputChange: null
    };
  },
  computed: {
    current: async function () {
      return this.$route.path;
    }
  },
  watch: {
    '$route.query.view': {
      handler() {
        this.activate();
      },
      flush: 'post',
      immediate: true
    },
    '$route.query.path': {
      handler() {
        this.activate();
      },
      flush: 'post',
      immediate: true
    },
  },
  mounted() {
  },
  methods: {
    activate: function () {
      if (this.$route.name === this.topNavHome) {
        this.active = this.topNavHome;
      } else {
        this.active = this.$route.name;
      }
    }
  }
};
</script>
