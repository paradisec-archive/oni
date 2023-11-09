<template>
  <template v-if="ui">
    <header class="sticky top-0 z-50">
      <nav-view/>
    </header>
    <main class="">
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
    if (this.$route.path === "/") this.$router.push("/search");
  },
  watch: {
    async '$route.path'() {
      if (this.$route.path === "/") this.$router.push("/search");
    },
  },
  data() {
    return {
      ui: this.$store.state.configuration?.ui
    }
  },
};
</script>

