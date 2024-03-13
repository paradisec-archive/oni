<template>
  <el-row>
    <el-col :xs="24" :sm="9" :md="9" :lg="7" :xl="7" offset="0"
            class="h-full max-h-screen overflow-y-auto flex flex-col h-screen p-2">
      <div v-show="!advancedSearch"
           class="flex-1 w-full min-w-full bg-white rounded mt-4 mb-4 shadow-md border">
        <search-bar ref='searchBar' @populate='populate' :searchInput="searchInput"
                    @search="search" :clearSearch="clear" :filters="this.filters" :fields="searchFields"
                    class="grow justify-items-center items-center m-4"
                    @advanced-search="enableAdvancedSearch" :enableAdvancedSearch="advancedSearch"
                    @updateSearchInput="onInputChange"
                    @basicSearch="updateRoutes" path="'map'"/>
      </div>
      <div class="flex-1 w-full min-w-full bg-white mt-4 mb-4 border-b-2">
        <div class="py-3 px-2">
          <div class="">
            <p class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
              Filters
            </p>
          </div>
        </div>
      </div>
      <div class="flex w-full" v-for="aggs of aggregations" :key="aggs.name">
        <ul v-if="aggs?.buckets?.length > 0 && !aggs['hide']"
            class="flex-1 w-full min-w-full bg-white rounded p-2 mb-4 shadow-md border">
          <li @click="aggs.active = !aggs.active"
              class="hover:cursor-pointer py-3 flex md:flex md:flex-grow flex-row justify-between space-x-1">
                <span class="text-xl text-gray-600 dark:text-gray-300 font-semibold py-1 px-2">
                  {{ aggs.display }}
                      <el-tooltip v-if="aggs.help"
                                  class="box-item"
                                  effect="light"
                                  trigger="hover"
                                  :content="aggs.help"
                                  placement="top"
                      >
                      <el-button link>
                        <font-awesome-icon icon="fa-solid fa-circle-info"/>
                      </el-button>
                    </el-tooltip>
                </span>
            <span class="py-1 px-2">
                    <font-awesome-icon v-if="aggs.active" icon="fa fa-chevron-down"/>
                  <span v-else>
                    <span class="text-xs rounded-full w-32 h-32 text-white bg-purple-500 p-1">{{
                        aggs?.buckets?.length
                      }}</span>&nbsp;
                    <font-awesome-icon icon="fa fa-chevron-right"/>
                    </span>
                </span>
          </li>
          <li v-if="aggs?.buckets?.length <= 0" class="w-full min-w-full">&nbsp;</li>
          <search-aggs :buckets="aggs.buckets" :aggsName="aggs.name" :ref="aggs.name"
                       v-show="aggs.active" @is-active="aggs.active = true"
                       @changed-aggs="newAggs"/>
        </ul>
      </div>
    </el-col>
    <el-col :xs="24" :sm="15" :md="15" :lg="17" :xl="17" offset="0"
            class="max-h-screen overflow-y-auto flex flex-row h-screen p-2 px-3">
      <div class="pr-0">
        <div class="top-20 z-10 bg-white pb-3">
          <el-row :align="'middle'" class="mt-4 pb-2 border-0 border-b-[2px] border-solid border-red-700 text-2xl">
            <el-col :span="20" class="m-2" :xs="18" :sm="17" :md="17" :lg="20" :xl="18">
              <span id="total_results" class="my-1 mr-2" v-show="total">Total: <span>{{ total }} Index entries (Collections, Objects, Files and Notebooks)</span></span>
              <span v-if="errorText">error: {{ errorText }}</span>
            </el-col>
            <el-col :span="2" class="m-2" :xs="4" :sm="5" :md="5" :lg="2" :xl="4">
              <el-button size="large" @click="showList()">
                <span><font-awesome-icon icon="fa-solid fa-list"/>&nbsp;List view</span>
              </el-button>
            </el-col>
          </el-row>
        </div>
      </div>
      <div id="map" class="flex-1 h-[calc(100vh-200px)]" v-once></div>
    </el-col>
  </el-row>
</template>
<script>
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import * as L from "leaflet";
import "leaflet.path.drag";
import "leaflet-editable";
import {GestureHandling} from "leaflet-gesture-handling";
import {
  reactive,
  computed,
  ref,
  onMounted,
  onUpdated,
  watch,
  onBeforeUnmount,
  nextTick,
  toRaw,
  defineAsyncComponent
} from "vue";
import {first, isEmpty, orderBy} from 'lodash';
import SearchDetailElement from './SearchDetailElement.component.vue';
import Geohash from "latlon-geohash";
import SearchAggs from "./SearchAggs.component.vue";
import {v4 as uuid} from 'uuid';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

L.ClickableTooltip = L.Popup.extend({
  onAdd: function (map) {
    L.Popup.prototype.onAdd.call(this, map);
    const el = this.getElement(),
        self = this;
    el.addEventListener('click', function () {
      self.fire("click");
    });
    el.style.pointerEvents = 'auto';
  }
});

L.SearchControl = L.Control.extend({
  options: {
    position: 'bottomright'
    //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
  },
  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-bottomcenter');
    var button = L.DomUtil.create('a', '', container);
    button.innerHTML = '<div><h3 class="text-2xl">S</h3></div>';
    button.className = 'leaflet-control-button-search'
    L.DomEvent.disableClickPropagation(button);
    //L.DomEvent.on(button, 'click', this._click);
    container.title = "Search Area";
    return container;
  }
});

L.LocationDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: require('assets/marker-circle-icon-2x.png'),
    iconUrl: require('assets/marker-circle-icon.png'),
    shadowUrl: require('assets/marker-circle-icon.png'),
    ref: '<a href="https://www.flaticon.com/free-icons/red" title="red icons">Red icons created by hqrloveq - Flaticon</a>',
    iconSize: [24, 26],// size of the icon
    shadowSize: null, // size of the shadow
    iconAnchor: [0, 0], // point of the icon which will correspond to marker's location
    shadowAnchor: null,  // the same for the shadow
    popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
  }
});

L.NumberedDivIcon = L.Icon.extend({
  options: {
    iconRetinaUrl: require('assets/marker-empty-icon.png'),
    iconUrl: require('assets/marker-empty-icon.png'),
    shadowUrl: require('assets/marker-empty-icon.png'),
    number: '',
    iconSize: new L.Point(25, 40),
    iconAnchor: new L.Point(12, 16),
    popupAnchor: new L.Point(0, -13),
    /*
    iconAnchor: (Point)
    popupAnchor: (Point)
    */
    className: 'leaflet-div-icon'
  },
  createIcon: function () {
    var div = document.createElement('div');
    var img = this._createImg(this.options['iconUrl']);
    var numdiv = document.createElement('div');
    numdiv.setAttribute("class", "number");
    numdiv.innerHTML = this.options['number'] || '';
    div.appendChild(img);
    div.appendChild(numdiv);
    this._setIconStyles(div, 'icon');
    return div;
  },
//you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: function () {
    return null;
  }
});

L.CountDivIcon = L.Icon.extend({
  options: {
    number: '',
    className: 'leaflet-div-icon'
  },
  createIcon: function () {
    var div = document.createElement('div');
    var img = this._createImg(this.options['iconUrl']);
    var numdiv = document.createElement('div');
    numdiv.setAttribute("class", "number");
    numdiv.innerHTML = this.options['number'] || '';
    div.appendChild(img);
    div.appendChild(numdiv);
    this._setIconStyles(div, 'icon');
    return div;
  },
//you could change this to add a shadow like in the normal marker if you really wanted
  createShadow: function () {
    return null;
  }
});

export default {
  name: 'SearchMap',
  components: {
    SearchBar: defineAsyncComponent(() =>
        import("@/components/SearchBar.component.vue")
    ),
    SearchAggs
  },
  props: {
    modelValue: {type: Array},
    viewport: {},
    buckets: {type: Array}
  },
  data() {
    return {
      total: 0,
      errorText: '',
      item: null,
      map: null,
      tooltipLayers: null,
      featuresLayer: null,
      geoHashLayer: null,
      markerSelected: false,
      leafletAggs: [],
      aggregations: [],
      advancedSearch: false,
      searchInput: '',
      clear: false,
      filters: [],
      newSearch: true
    }
  },
  setup() {
  },
  created() {
    if (this.$route.query.q) {
      this.searchInput = this.$route.query.q;
    }
  },
  async mounted() {
    //console.log('map mounted');
    // wait so that leaflet div has a size because otherwise the tiles won't load
    //await new Promise(r => setTimeout(r, 100));
    //setTimeout(initMap, 100);
    this.initMap();
    this.updateTooltipLayer();
    this.updateLayerBuckets(this.buckets);
    this.initControls();
  },
  async updated() {
    //console.log('map updated');
    if (this.map && this.featuresLayer && this.geoHashLayer) {
      this.updateLayerBuckets(this.buckets);
      this.initControls();
    }
  },
  onBeforeUnmount() {
    if (this.map) {
      this.map.remove();
    }
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove();
    }
  },
  watch: {
    'buckets': {
      async handler(val) {
        // if (this.geoHashLayer) {
        //   console.log('updateLayerBuckets');
        //   this.updateLayerBuckets(val);
        // }
      },
      flush: 'post',
      immediate: true
    },
    'modelValue': {
      async handler(val) {
        //todo: compare new values to existing values, only update when there is difference
      },
      flush: 'post',
      immediate: true
    },
    async '$route.query'() {
      this.loading = true;
      if (this.$route.query.s) {
        this.isStart = true;
        this.resetSearch();
      } else {
        await this.updateFilters({});
        this.onInputChange(this.$route.query.q);
        this.currentPage = 1;
        if (this.$route.query.a) {
          this.updateAdvancedQueries();
        }
        await this.search();
      }
      this.loading = false;
    }
  },
  methods: {
    initMap() {
      this.searchFields = this.$store.state.configuration.ui.searchFields;
      this.featuresLayer = L.featureGroup();
      this.geoHashLayer = L.featureGroup();
      this.tooltipLayers = L.layerGroup()
      this.map = L.map("map", {
        gestureHandling: true
      });
      //TODO: pass this via config. Center location and zoom level
      this.map.setView([-25, 134], 3);
      L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      L.control.scale().addTo(this.map);
      this.featuresLayer.addTo(this.map);
      this.geoHashLayer.addTo(this.map);
      this.tooltipLayers.addTo(this.map);
      const control = new L.SearchControl();
      control.addTo(this.map);
    },
    updateTooltipLayer() {
      this.tooltipLayers.clearLayers();
    },
    updateLayerBuckets(val) {
      this.geoHashLayer.clearLayers();
      if (!val) return;
      for (const bucket of val) {
        try {
          const geohash = bucket['key'];
          const latlon = Geohash.decode(geohash);
          const bounds = Geohash.bounds(geohash);
          let asWKT;
          let shape;
          if (bucket['doc_count'] > 0) {
            // TODO: clean if we are doing radius for everything or setup > 1 so you can have a single icon no circle
            // These next 2 lines will create a CIRCLE and
            // const radius = this.geohashRadius(geohash);
            // asWKT = `CIRCLE ( (${latlon['lon']} ${latlon['lat']}), ${radius} )`;
            const count = L.marker(latlon, {
              icon: new L.NumberedDivIcon({number: bucket['doc_count']})
            });
            count._data = {docCount: bucket['doc_count'], key: geohash, latlng: latlon};
            count.addTo(this.geoHashLayer);
            let color = '#ffffff';
            const docCount = bucket['doc_count'];
            if (docCount <= 1)
              color = '#ffea1f';
            if (docCount > 1 && docCount <= 10)
              color = '#4470a2';
            if (docCount > 10 && docCount <= 30)
              color = '#14a848';
            if (docCount > 30)
              color = '#ff0000';

            shape = L.rectangle(
                [[bounds.sw.lat, bounds.sw.lon], [bounds.ne.lat, bounds.ne.lon]],
                {color, weight: 1, opacity: 0.7}
            );
          } else {
            //TODO decide whether to use single marker or no
            shape = L.marker(latlon, {
              icon: new L.LocationDivIcon()
            });
          }
          shape._data = {docCount: bucket['doc_count'], key: geohash, latlng: latlon};
          shape.addTo(this.geoHashLayer);
        } catch (error) {
          console.log(error);
        }
      }
    },
    initControls() {
      // console.log(featuresLayer.getLayers());
      //const viewport = this.viewport?.bounds;
      //TODO: give this INIT via config
      const viewport = {
        bottom_right: {lat: -11.523088, lon: 162.649886},
        top_left: {lat: -42.811522, lon: 108.649010}
      };
      let bounds;
      if (viewport && viewport.bottom_right && viewport.top_left) {
        var southwest = L.latLng(viewport.bottom_right.lat, viewport.bottom_right.lon);
        var northeast = L.latLng(viewport.top_left.lat, viewport.top_left.lon);
        bounds = L.latLngBounds(southwest, northeast);
      } else if (this.geoHashLayer) {
        bounds = this.geoHashLayer.getBounds();
        if (bounds.isValid()) this.map.flyToBounds(bounds, {maxZoom: 9});
      } else {
        bounds = this.featuresLayer.getBounds();
        if (bounds.isValid()) this.map.flyToBounds(bounds, {maxZoom: 9});
      }
      if (bounds.isValid()) this.map.flyToBounds(bounds, {maxZoom: 9});

      this.map.on('load', async (e) => {
        await this.searchEvent({clearPopup: false});
      });

      this.map.on('zoomend', async (e) => {
        await this.searchEvent({clearPopup: true});
      });

      this.map.on('dragend', async (e) => {
        await this.searchEvent({clearPopup: false});
      });

      this.geoHashLayer.on('click', async (e) => {
        //console.log('geoHashLayer click', e);
        //L.DomEvent.stop(e);
        let innerHHTML = '';
        this.markerSelected = false;
        const data = e.layer?._data;
        // TODO: ask people if they like this behaviour
        if (data?.docCount > 10) {
          //if there are more than X zoom in
          const newZoom = this.map.getZoom();
          let nextZoom = 1;
          if (data?.docCount >= 30) {
            nextZoom = 4;
          }
          if (data?.docCount >= 10) {
            nextZoom = 2;
          }
          this.map.setView(e.latlng, newZoom + nextZoom);
        } else {
          if (e.layer?._data) {
            const data = e.layer?._data;
            //TODO: get the one
            const result = await this.searchGeoHash({geohash: data.key});
            const hits = document.createElement('div');
            for (let hit of result['hits']['hits']) {
              const newDiv = document.createElement('div');
              newDiv.innerHTML = this.getInnerHTMLTooltip(hit['_source']);
              hits.appendChild(newDiv);
            }

            const tooltip = new L.ClickableTooltip({
              direction: 'right',
              permanent: false,
              noWrap: true,
              maxWidth: 400,
              maxHeight: 400
            });
            tooltip.setContent(hits.innerHTML);
            tooltip.setLatLng(e.latlng);
            tooltip.addTo(this.tooltipLayers);
            this.markerSelected = true;
          }
        }
      });

      this.featuresLayer.on('click', (e) => {
        //console.log('featuresLayer click', e);
        //L.DomEvent.stop(e);
        let innerHHTML = '';
        let item = null;
        this.markerSelected = false;
        if (e.layer?._data) {
          item = e.layer._data;
          innerHHTML = this.getInnerHTMLTooltip(item);
          const tooltip = new L.ClickableTooltip({
            direction: 'center',
            permanent: false,
            noWrap: true,
            opacity: 1
          });
          tooltip.setContent(innerHHTML);
          tooltip.setLatLng(e.latlng);
          tooltip.addTo(this.map);
          this.markerSelected = true;
        }
      });
    },
    open(route) {
      this.$router.push({path: route});
    },
    getSearchDetailUrl(item) {
      let url;
      const types = item['@type'] || [];
      const repoType = types.find(t => t === 'RepositoryCollection');
      const fileType = types.find(t => t === 'File');
      const itemType = types.find(t => t === 'RepositoryObject');
      let id = encodeURIComponent(item['@id']);
      let crateId = encodeURIComponent(first(item['_crateId'])?.['@value']);
      if (repoType) {
        url = `/collection?id=${id}&_crateId=${crateId}`
      } else if (itemType) {
        url = `/object?id=${id}&_crateId=${crateId}`
      } else if (fileType) {
        let isNotebook;
        if (item?.['conformsTo']) {
          isNotebook = item['conformsTo'].find(c => c['@id'] === this.conformsToNotebook);
        }
        if (isNotebook) {
          id = encodeURIComponent(item._id);
          url = `/object?_id=${id}`;
        } else {
          const fileId = id;
          id = encodeURIComponent(first(item['_parent'])?.['@id']);
          url = `/object?id=${id}&_crateId=${crateId}&fileId=${fileId}`
        }
      } else {
        //Defaults to object if it doesnt know what it is
        url = `/object?id=${id}&_crateId=${crateId}`
      }
      return url;
    },
    getInnerHTMLTooltip(item) {
      const title = first(item.name)['@value'] || item['@id'];
      const type = item['@type'];
      const href = this.getSearchDetailUrl(item);
      const _memberOf = item['_memberOf'] || [];
      let innerHTMLMemberOf = '';
      if (Array.isArray(_memberOf) && _memberOf.length > 0) {
        for (let mO of _memberOf) {
          innerHTMLMemberOf += `
        <a class="text-sm m-2 text-gray-700 dark:text-gray-300 underline"
               href="/collection?id=${mO?.['@id']}&_crateId=${encodeURIComponent(mO?.['@id'])}">
        ${first(mO?.name)?.['@value'] || mO?.['@id']}
        </a>
      `;
        }
        const innerHHTML = `
        <div>
            <h3 class="text-2xl">
            <a href="${href}">${title}</a></h3>
            <h4>Type: ${type}</h4>
            <div :align="'middle'" v-if="" class="">
            <p class="font-normal text-gray-700">
                Member of:&nbsp;
            </p>
            <div class="flex flex-wrap">
                ${innerHTMLMemberOf}
            </div>
          <div>
            <a href="${href}">See more</a>
          </div>
        </div>
        <hr class="divide-y divide-gray-500"/>
      `;
        return innerHHTML;
      }
    },
    async search({precision}) {
      //console.log('search');
      const bounds = this.map.getBounds();
      if (bounds.isValid()) {
        const boundingBox = {
          topRight: {lat: bounds._northEast.lat, lon: bounds._northEast.lng},
          bottomLeft: {lat: bounds._southWest.lat, lon: bounds._southWest.lng}
        }
        const items = await this.$elasticService.map({init: false, boundingBox, precision});
        this.leafletAggs = items.aggregations['_geohash'];
        this.aggregations = this.populateAggregations(items.aggregations);
        const total = items.hits?.total;
        this.total = total?.value || 0;
        return items;
      } else {
        return [];
      }
    },
    async searchGeoHash({geohash}) {
      let boundingBox;
      if (geohash) {
        const bounds = Geohash.bounds(geohash);
        boundingBox = {
          topRight: {lat: bounds.ne.lat, lon: bounds.ne.lon},
          bottomLeft: {lat: bounds.sw.lat, lon: bounds.sw.lon}
        }
        const items = await this.$elasticService.map({init: false, boundingBox});
        return items;
      }
    },
    calculatePrecision(zoomLevel) {
      // This is a way to match zoom levels in leaflet vs precision levels in elastic geoHashGridAggregation
      let precision = zoomLevel / 2;
      if (precision < 1) {
        precision = 1;
      } else if (precision > 7) {
        precision = 7;
      }
      return precision;
    },
    async searchEvent({clearPopup}) {
      if (clearPopup) {
        this.updateTooltipLayer();
      }
      this.updateLayerBuckets();//Clear layers
      const zoomLevel = this.map.getZoom();
      const precision = this.calculatePrecision(zoomLevel)
      await this.search({precision});
      const viewport = this.leafletAggs;
      this.updateLayerBuckets(viewport?.buckets);

    },
    // Approximate the radius in meters of a geohash
    geohashRadius(geohash) {
      // Length of a degree (in meters) at the equator
      const metersPerDegree = 111319.9;

      // Length of a degree (in meters) at the given latitude
      function degToMetersLat(latitude) {
        return metersPerDegree * (1 / Math.cos(latitude * Math.PI / 180));
      }

      // Decode the geohash to get its bounding box
      const bbox = Geohash.bounds(geohash);

      // Calculate the center latitude and longitude of the bounding box
      const centerLatitude = (bbox.ne.lat + bbox.sw.lat) / 2;
      //TODO: center longitude not used?
      const centerLongitude = (bbox.ne.lon + bbox.sw.lon) / 2;

      // Calculate the width and height of the bounding box in degrees
      const widthDeg = bbox.ne.lat - bbox.sw.lat; //bbox[1] - bbox[0];
      const heightDeg = bbox.ne.lon - bbox.sw.lon;//bbox[3] - bbox[2];

      // Convert the width and height from degrees to meters
      const widthMeters = widthDeg * metersPerDegree;
      const heightMeters = heightDeg * degToMetersLat(centerLatitude);

      // Use the average of the width and height as the approximate radius
      const radius = (widthMeters + heightMeters) / 2;
      return radius;
    },
    showList() {
      this.$router.push({path: '/search'});
    },
    newAggs({query, aggsName}) {
      if (query.f) {
        //In here we need to merge the filters
        const decodedFilters = JSON.parse(decodeURIComponent(query.f));
        this.mergeFilters(decodedFilters, aggsName);
      }
      if (query.q) {
        this.searchInput = decodeURIComponent(query.q);
      }
      console.log(isEmpty(this.filters))
      this.changedFilters = true;
    },
    populate({items, newSearch, aggregations}) {
      this.items = [];
      if (newSearch) {
        this.newSearch = true;

      }
      if (items?.['hits']) {
        const thisItems = items['hits']['hits'];
        this.totals = items['hits']['total'];
        if (thisItems.length > 0) {
          for (let item of thisItems) {
            this.items.push(item);
          }
          this.more = true;
        } else {
          this.more = false;
        }
      }
      if (items?.['aggregations']) {
        this.aggregations = this.populateAggregations(items['aggregations']);
        this.memberOfBuckets = items['aggregations']?.['_memberOf.name.@value'];
      }
    },
    populateAggregations(aggregations) {
      const a = {};
      //Note: below is converted to an ordered array not an object.
      const aggInfo = this.$store.state.configuration.ui.aggregations;
      for (let agg of Object.keys(aggregations)) {
        const info = aggInfo.find((a) => a['name'] === agg);
        const display = info?.display;
        const order = info?.order;
        const name = info?.name;
        const hide = info?.hide;
        const active = info?.active;
        const help = info?.help;
        a[agg] = {
          buckets: aggregations[agg]?.buckets || aggregations[agg]?.values?.buckets,
          display: display || agg,
          order: order || 0,
          name: name || agg,
          hide: hide,
          active: active,
          help: help || ''
        };
      }
      return orderBy(a, 'order');
    },
    enableAdvancedSearch() {
      alert('not enabled for Map Search yet, coming soon!')
    },
    onInputChange() {

    },
    async updateRoutes({queries, updateFilters}) {
      let filters;
      const query = {};
      let localFilterUpdate = false;
      if (!isEmpty(this.filters) || updateFilters) {
        filters = toRaw(this.filters);
        filters = encodeURIComponent(JSON.stringify(filters));
        query.f = filters;
        localFilterUpdate = true;
      } else {
        delete query.f;
      }
      if (this.$route.query.f && !localFilterUpdate) {
        query.f = this.$route.query.f;
      }
      let localSearchGroupUpdate = false;
      if (queries?.searchGroup) {
        this.advancedQueries = queries;
        delete query.q;
        query.a = queries.searchGroup;
        this.currentPage = 1;
        //this.selectedSorting = this.sorting[0];
        localSearchGroupUpdate = true;
      }
      if (this.$route.query.a && !localSearchGroupUpdate) {
        query.a = this.$route.query.a;
        delete query.q;
        this.updateAdvancedQueries();
      } else {
        this.advancedQueries = null; //clear advanced search
        query.q = this.searchInput;
      }
      query.r = uuid();
      await this.$router.push({path: 'map', query, replace: true});
    },
    async updateFilters({clear, empty}) {
      try {
        // updating filters from command
        if (clear?.f && clear?.filterKey) {
          if (this.filters[clear.filterKey]) {
            this.filters[clear.filterKey].splice(this.filters[clear.filterKey].indexOf(clear.f), 1);
            if (isEmpty(this.filters[clear.filterKey])) {
              delete this.filters[clear.filterKey];
            }
            //if there is an update on the filter the site will do another search.
            await this.updateRoutes({updateFilters: true});
          }
        } else {
          // or updating filters from routes
          if (isEmpty(this.$route.query.f)) {
            this.filters = {};
          } else {
            let filterQuery;
            const filters = decodeURIComponent(this.$route.query.f);
            filterQuery = JSON.parse(filters);
            this.filters = {};
            for (let [key, val] of Object.entries(filterQuery)) {
              this.filters[key] = val;
              if (this.filters[key].length === 0) {
                delete this.filters[key];
              }
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    },
    resetSearch() {
      console.log('TODO: reset search');
    }
  }
}

</script>

<style>
.oni-tooltip-marker {
  width: 200px;
  white-space: normal;
}

.leaflet-div-icon {
  background: transparent;
  border: none;
}

.leaflet-marker-icon .number {
  position: relative;
  top: 0;
  font-size: 20px;
  width: 25px;
  text-align: center;
  font-weight: bold;
  color: brown;
  background-color: transparent;
  border: none;
  border-radius: 50%;
  padding: 1px;
}

.leaflet-tooltip .leaflet-zoom-animated .leaflet-tooltip-center {
  overflow: scroll;
}

.leaflet-tooltip .leaflet-zoom-animated .leaflet-tooltip-right {
  overflow: scroll;
}

/*.circle {*/
/*  display: table-cell;*/
/*  text-align: center;*/
/*  vertical-align: middle;*/
/*  border-radius: 50%;*/
/*  border-style: none;*/
/*  font-size: 16px;*/
/*  font-weight: bold;*/
/*  background: rgba(0, 57, 128, 0.2);*/
/*  border-color: #3388FF;*/
/*  color: white;*/
/*}*/

</style>
