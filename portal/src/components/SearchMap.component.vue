<template>
  <el-row>
    <el-col :span="24">
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
import {reactive, computed, ref, onMounted, onUpdated, watch, onBeforeUnmount, nextTick, toRaw} from "vue";
import {first} from 'lodash';
import SearchDetailElement from './SearchDetailElement.component.vue';
import Geohash from "latlon-geohash";
import {_private} from './widgets/geo_wkt';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

L.ClickableTooltip = L.Tooltip.extend({
  onAdd: function (map) {
    L.Tooltip.prototype.onAdd.call(this, map);
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
    shadowSize:   null, // size of the shadow
    iconAnchor:   [0,0], // point of the icon which will correspond to marker's location
    shadowAnchor: null,  // the same for the shadow
    popupAnchor:  [0,0] // point from which the popup should open relative to the iconAnchor
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
    console.log('created icon');
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
  props: {
    modelValue: {type: Array},
    viewport: {},
    buckets: {type: Array}
  },
  data() {
    return {
      item: null,
      map: null,
      featuresLayer: null,
      geoHashLayer: null,
      markerSelected: false
    }
  },
  setup() {
    console.log('hello setup')
  },
  async mounted() {
    console.log('map mounted');
    // wait so that leaflet div has a size because otherwise the tiles won't load
    //await new Promise(r => setTimeout(r, 100));
    //setTimeout(initMap, 100);
    this.initMap();
    this.updateLayers(this.modelValue);
    this.updateLayerBuckets(this.buckets);
    this.initControls();
  },
  async updated() {
    console.log('map updated');
    if (this.map && this.featuresLayer && this.geoHashLayer) {
      this.updateLayers(this.modelValue);
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
        if (this.geoHashLayer) {
          console.log('updateLayerBuckets');
          this.updateLayerBuckets(val);
        }
      },
      flush: 'post',
      immediate: true
    },
    'modelValue': {
      async handler(val) {
        //todo: compare new values to existing values, only update when there is difference
        if (this.featuresLayer) {
          console.log('updateLayers');
          this.updateLayers(val);
        }
      },
      flush: 'post',
      immediate: true
    }
  },
  methods: {
    initMap() {
      this.featuresLayer = L.featureGroup();
      this.geoHashLayer = L.featureGroup();
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
      const control = new L.SearchControl();
      control.addTo(this.map);
    },
    updateLayerBuckets(val) {
      this.geoHashLayer.clearLayers();
      if (!val) return;
      for (const bucket of val) {
        try {
          const latlon = Geohash.decode(bucket['key']);
          const boundingBox = this.getBoundingBox(bucket['key']);
          console.log(boundingBox)
          let asWKT;
          if (bucket['doc_count'] > 1) {
            const radius = this.geohashRadius(bucket['key']);
            asWKT = `CIRCLE ( (${latlon['lon']} ${latlon['lat']}), ${radius} )`;
            const count = L.marker(latlon, {
              icon: new L.NumberedDivIcon({number: bucket['doc_count']})
            });
            count._data = {docCount: bucket['doc_count'], key: bucket['key'], latlng: latlon};
            count.addTo(this.geoHashLayer);
          } else {
            asWKT = `POINT ( ${latlon['lon']} ${latlon['lat']} )`;
          }
          const shape = _private.read(L, asWKT, bucket['doc_count'],);
          shape._data = {docCount: bucket['doc_count'], key: bucket['key'], latlng: latlon};
          shape.addTo(this.geoHashLayer);
        } catch (error) {
          console.log(error);
        }
      }
    },
    updateLayers(val) {
      this.featuresLayer.clearLayers();
      if (!val) return;
      for (const item of val) {
        if (item?.['_contentLocation']) {
          try {
            const shape = _private.read(L, item['_contentLocation'])
            shape._data = toRaw(item);
            // shape.addTo(featuresLayer);
          } catch (error) {
            console.log(error);
          }
        }
        if (item?.['_spatialCoverage']) {
          try {
            const shape = _private.read(L, item['_spatialCoverage'])
            shape._data = toRaw(item);
            // shape.addTo(featuresLayer);
          } catch (error) {
            console.log(error);
          }
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
      if (bounds.isValid()) this.map.flyToBounds(bounds, {maxZoom: 10});

      this.map.on('load', async (e) => {
        await this.searchEvent();
      });

      this.map.on('zoomend', async (e) => {
        await this.searchEvent();
      });

      this.map.on('dragend', async (e) => {
        await this.searchEvent();
      });

      this.geoHashLayer.on('click', async (e) => {
        console.log('geoHashLayer click', e);
        //L.DomEvent.stop(e);
        let innerHHTML = '';
        this.markerSelected = false;
        const data = e.layer?._data;
        // TODO: ask people if they like this behaviour
        if (data?.docCount > 4) {
          //if there are more than X zoom in
          console.log(e);
          const newZoom = this.map.getZoom();
          this.map.setView(e.latlng, newZoom + 1);
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
              direction: 'center',
              permanent: false,
              noWrap: true,
              opacity: 1
            });
            tooltip.setContent(hits.innerHTML);
            tooltip.setLatLng(e.latlng);
            tooltip.addTo(this.map);
            this.markerSelected = true;
          }
        }
      });

      this.featuresLayer.on('click', (e) => {
        console.log('featuresLayer click', e);
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
      console.log('button clicked!')
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
            <p class="font-normal text-gray-700 dark:text-gray-400 dark:text-white">
                Member of:&nbsp;
            </p>
            <div class="flex flex-wrap">
                ${innerHTMLMemberOf}
            </div>
          <div>
            <a href="${href}">See more</a>
          </div>
        </div>
      `;
        return innerHHTML;
      }
    },
    async search({precision}) {
      console.log('search');
      let boundingBox;
      let items;
      const bounds = this.map.getBounds();
      boundingBox = {
        topRight: {lat: bounds._northEast.lat, lon: bounds._northEast.lng},
        bottomLeft: {lat: bounds._southWest.lat, lon: bounds._southWest.lng}
      }
      if (bounds.isValid()) {
        items = await this.$elasticService.map({init: false, boundingBox, precision});
        return items;
      } else {
        return [];
      }
    },
    async searchGeoHash({geohash}) {
      let boundingBox;
      if (geohash) {
        const bounds = Geohash.bounds(geohash)
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
    async searchEvent() {
      this.updateLayerBuckets();//Clear layers
      const zoomLevel = this.map.getZoom();
      const precision = this.calculatePrecision(zoomLevel)
      const result = await this.search({precision});
      if (result.aggregations?.viewport) {
        const viewport = result.aggregations?.viewport;
        this.updateLayerBuckets(viewport?.buckets);
      }
    },
    getBoundingBox(geohashString) {
      const {latitude, longitude} = Geohash.decode(geohashString);
      const bounds = Geohash.bounds(geohashString);
      return {
        sw: {lat: bounds[0], lon: bounds[1]},
        ne: {lat: bounds[2], lon: bounds[3]},
        center: {lat: latitude, lon: longitude}
      };
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
  background-color: azure;
  border: none;
  border-radius: 50%;
  padding: 1px;
}

.leaflet-tooltip .leaflet-zoom-animated .leaflet-tooltip-center {
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
