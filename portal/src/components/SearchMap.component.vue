<script setup>
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import * as L from "leaflet";
import "leaflet.path.drag";
import "leaflet-editable";
import {GestureHandling} from "leaflet-gesture-handling";
import {reactive, computed, ref, onMounted, onUpdated, watch, onBeforeUnmount, nextTick, toRaw} from "vue";
import {first} from 'lodash';
import SearchDetailElement from './SearchDetailElement.component.vue';

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

    el.addEventListener('click', function() {
      self.fire("click");
    });
    el.style.pointerEvents = 'auto';
  }
});

import {_private} from './widgets/geo_wkt';

const props = defineProps({
  modelValue: {type: Array},
  viewport: {}
});
const data = reactive({
  markerSelected: false
});
let item;
const mapRef = ref();
var map;
var featuresLayer;

onMounted(async () => {
  console.log('map mounted');
  // wait so that leaflet div has a size because otherwise the tiles won't load
  await new Promise(r => setTimeout(r, 100));
  //setTimeout(initMap, 100);
  initMap();
  updateLayers(props.modelValue);
  initControls(map, featuresLayer);
});

onUpdated(async () => {
  console.log('map updated');
  if (featuresLayer) {
    updateLayers(props.modelValue);
    initControls(map, featuresLayer);
  }
});

onBeforeUnmount(() => {
  if (map) map.remove();
});

function initMap() {
  featuresLayer = L.featureGroup();
  map = L.map(mapRef.value, {
    gestureHandling: true
  });

  map.setView([-27, 140], 3);
  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.scale().addTo(map);
  featuresLayer.addTo(map);
}

watch(props.modelValue, (val) => {
  //todo: compare new values to existing values, only update when there is difference
  if (featuresLayer) {
    console.log('shapes updated');
    updateLayers(val);
  }
}, {immediate: true});

function updateLayers(val) {
  featuresLayer.clearLayers();
  if (!val) return;
  for (const item of val) {
    if (item?.['_contentLocation']) {
      try {
        const shape = _private.read(L, item['_contentLocation'])
        shape._data = toRaw(item);
        shape.addTo(featuresLayer);
      } catch (error) {
        console.log(error);
      }
    }
    if (item?.['_spatialCoverage']) {
      try {
        const shape = _private.read(L, item['_spatialCoverage'])
        shape._data = toRaw(item);
        shape.addTo(featuresLayer);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

function initControls(map, featuresLayer) {

  // console.log(featuresLayer.getLayers());
  const viewport = props.viewport?.bounds;
  let bounds;
  if (viewport && viewport.bottom_right && viewport.top_left) {
    var southwest = L.latLng(viewport.bottom_right.lat, viewport.bottom_right.lon);
    var northeast = L.latLng(viewport.top_left.lat, viewport.top_left.lon);
    bounds = L.latLngBounds(southwest, northeast);
  } else {
    bounds = featuresLayer.getBounds();
    if (bounds.isValid()) map.flyToBounds(bounds, {maxZoom: 9});
  }
  if (bounds.isValid()) map.flyToBounds(bounds, {maxZoom: 10});

  map.on('click', function (e) {
    console.log('map click', e);
  });

  featuresLayer.on('click', function (e) {
    //console.log('featuresLayer click', e);
    L.DomEvent.stop(e);
    let innerHHTML = '';
    item = null;
    data.markerSelected = false;
    if (e.layer?._data) {
      item = e.layer._data;
      innerHHTML = getInnerHTMLTooltip(item);
      const tooltip = new L.ClickableTooltip({
        direction: 'center',
        permanent: false,
        noWrap: true,
        opacity: 1
      });
      tooltip.setContent(innerHHTML);
      tooltip.setLatLng(e.latlng);
      tooltip.addTo(map);
      data.markerSelected = true;
    }
  });
}

function open(route) {
  console.log('button clicked!')
  this.$router.push({path: route});
}

function getSearchDetailUrl(item) {
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
}

function getInnerHTMLTooltip(item) {
  const title = first(item.name)['@value'] || item['@id'];
  const type = item['@type'];
  const href = getSearchDetailUrl(item);
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
}

</script>
<template>
  <el-row>
    <el-col :span="24">
      <div ref="mapRef" class="flex-1 h-[calc(100vh-200px)]" v-once></div>
    </el-col>
  </el-row>
</template>
<style>
.oni-tooltip-marker {
  width: 200px;
  white-space: normal;
}

</style>
