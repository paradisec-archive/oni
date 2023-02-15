<template>
  <template v-if="ui">
    <header>
      <nav-view/>
    </header>
    <main class="flex-grow">
      <router-view/>
    </main>
    <footer>
      <footer-view/>
    </footer>
  </template>
  <template v-else>
    <MaintenacePage/>
  </template>
</template>

<script>
import NavView from './Nav.component.vue';
import FooterView from './Footer.component.vue';
import MaintenacePage from "./MaintenacePage.vue";

export default {
  components: {
    MaintenacePage,
    NavView,
    FooterView
  },
  beforeMount() {
  },
  mounted() {
    if (this.$route.path === "/") this.$router.push("/main?view=collections");
  },
  watch: {
    async '$route.path'() {
      if (this.$route.path === "/") this.$router.push("/main?view=collections");
    },
  },
  data() {
    return {
      ui: this.$store.state.configuration?.ui
    }
  },
};
</script>

