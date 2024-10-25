import "regenerator-runtime";
import "@/assets/tailwind.css";
import "element-plus/theme-chalk/index.css";
import {library} from '@fortawesome/fontawesome-svg-core'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
import {fas} from "@fortawesome/free-solid-svg-icons";
import {far} from "@fortawesome/free-regular-svg-icons";
import {fab} from "@fortawesome/free-brands-svg-icons"

library.add(fas, far, fab);

import {createApp} from "vue";
import App from "./App.vue";
import router from "./routes";
import {store} from "./store";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import {MankuIcon} from "manku-icon-lib";
import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
import VuePapaParse from 'vue-papa-parse';
import { VueHeadMixin, createHead } from '@unhead/vue';

const level = process.env.NODE_ENV === "development" ? "debug" : "warn";
log.setLevel(level);
const prefixer = prefix.noConflict();
prefixer.reg(log);
prefixer.apply(log);
import HTTPService from "./http.service";
import MembershipService from "./membership.service";
import ElasticService from "./elastic.service";
import ApiService from "./api.service";
import VueGtag from "vue-gtag";
import configuration from "../configuration.json";

(async () => {
  const app = createApp(App);
  const head = createHead();
  app.mixin(VueHeadMixin);
  app.use(head);
  app.use(store);
  app.use(router);
  app.use(ElementPlus);
  app.use(VuePapaParse);
  app.component('font-awesome-icon', FontAwesomeIcon);
  app.component('manku-icon', MankuIcon);
  app.config.globalProperties.$http = new HTTPService({router, loginPath: "/login"});
  app.config.globalProperties.$log = log;

  if (configuration.ui && configuration.ui?.analytics?.['gaMeasurementId']) {
    app.use(VueGtag, {
      config: {id: configuration.ui.analytics['gaMeasurementId']},
      router
    });
  }
  store.commit("saveConfiguration", {...configuration});

  app.config.globalProperties.$membership = new MembershipService({router});
  app.config.globalProperties.$api = new ApiService({router, configuration});
  // app.config.globalProperties.$elasticService = new ElasticService({router, configuration});

  app.mount("#app");

  // app.config.globalProperties.$socket = io();
  // app.config.productionTip = false;

})();
