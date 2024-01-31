<script setup>
import "leaflet/dist/leaflet.css";
import "leaflet-gesture-handling/dist/leaflet-gesture-handling.css";
import * as L from "leaflet";
import "leaflet.path.drag";
import "leaflet-editable";
import {GestureHandling} from "leaflet-gesture-handling";
import {reactive, computed, ref, onMounted, watch, onBeforeUnmount, nextTick} from "vue";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

import {_private} from './widgets/geo_wkt';

const props = defineProps({
  modelValue: {type: Array},
  viewport: {}
});
const mapRef = ref();
var map;
onMounted(async () => {
  console.log('map mounted');
  // wait so that leaflet div has a size because otherwise the tiles won't load
  await new Promise(r => setTimeout(r, 100));
  //setTimeout(initMap, 100);
  initMap();
});

onBeforeUnmount(() => {
  if (map) map.remove();
});

function initMap() {
  const featuresLayer = L.featureGroup();
  map = L.map(mapRef.value, {
    gestureHandling: true
  });

  map.setView([-27, 140], 3);
  L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.scale().addTo(map);
  featuresLayer.addTo(map);

  watch(props.modelValue, (val) => {
    //todo: compare new values to existing values, only update when there is difference
    console.log('shapes updated');

    featuresLayer.clearLayers();
    if (!val) return;
    for (const item of val) {
      if (item?.['_contentLocation']) {
        try {
          const shape = _private.read(L, item['_contentLocation'])
          shape.addTo(featuresLayer);
        } catch (error) {
          console.log(error);
        }
      }
      if (item?.['_spatialCoverage']) {
        try {
          const shape = _private.read(L, item['_spatialCoverage'])
          shape.addTo(featuresLayer);
        } catch (error) {
          console.log(error);
        }
      }
    }
    // console.log(featuresLayer.getLayers());
    const viewport = props.viewport?.bounds;
    let bounds;
    if (viewport && viewport.bottom_right && viewport.top_left) {
      var southwest = L.latLng(viewport.bottom_right.lat, viewport.bottom_right.lon);
      var northeast = L.latLng(viewport.top_left.lat, viewport.top_left.lon);
      bounds = L.latLngBounds(southwest, northeast);
    } else {
      bounds = featuresLayer.getBounds();
      if (bounds.isValid()) map.flyToBounds(bounds, {maxZoom: 7});
    }
    if (bounds.isValid()) map.flyToBounds(bounds, {maxZoom: 7});
  }, {immediate: true});

}

</script>
<template>
  <div ref="mapRef" class="flex-1 h-[calc(100vh-200px)]" v-once></div>
</template>
<style>
.leaflet-control-draw a.leaflet-control-draw-point {
  background-position: -120px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-line {
  background-position: 0 -1px;
}

.leaflet-control-draw a.leaflet-control-draw-box {
  background-position: -60px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-circle {
  background-position: -90px -1px;
}

.leaflet-control-draw a.leaflet-control-draw-polygon {
  background-position: -29px -1px;
}

.leaflet-control-edit a.leaflet-control-edit-delete {
  background-position: -180px -1px;
}

.leaflet-control-draw a,
.leaflet-control-edit a {
  display: block;
  background-repeat: no-repeat;
  background-size: 300px 30px;
  background-clip: padding-box;
  background-image: linear-gradient(transparent, transparent), url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="60"%3E%3Cg style="fill:%23464646;fill-opacity:1"%3E%3Cg style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M18 36v6h6v-6h-6zm4 4h-2v-2h2v2zM36 18v6h6v-6h-6zm4 4h-2v-2h2v2z" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="m23.142 39.145-2.285-2.29 16-15.998 2.285 2.285z" style="fill:%23464646;fill-opacity:1"/%3E%3C/g%3E%3Cpath d="m100 24.565-2.096 14.83L83.07 42 76 28.773 86.463 18ZM140 20h20v20h-20zM221 30c0 6.078-4.926 11-11 11s-11-4.922-11-11c0-6.074 4.926-11 11-11s11 4.926 11 11zM270 19c-4.971 0-9 4.029-9 9s5.001 12 9 14c4.001-2 9-9.029 9-14s-4.029-9-9-9zm0 12.5c-2.484 0-4.5-2.014-4.5-4.5 0-2.484 2.016-4.5 4.5-4.5 2.485 0 4.5 2.016 4.5 4.5 0 2.486-2.015 4.5-4.5 4.5z" style="fill:%23464646;fill-opacity:1"/%3E%3Cg id="a" style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M337 30.156v6.011c0 1.658-1.344 3-3 3h-10c-1.655 0-3-1.342-3-3v-10c0-1.657 1.345-3 3-3h6.345l3.19-3.17H324c-3.313 0-6 2.687-6 6v10c0 3.313 2.687 6 6 6h10c3.314 0 6-2.687 6-6v-8.809l-3 2.968" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="m338.72 24.637-8.892 8.892H327V30.7l8.89-8.89z" style="fill:%23464646;fill-opacity:1"/%3E%3Cpath d="M338.697 17.826h4v4h-4z" style="fill:%23464646;fill-opacity:1" transform="rotate(-134.9900002 340.70299871 19.81699862)"/%3E%3C/g%3E%3Cg id="b" style="fill:%23464646;fill-opacity:1"%3E%3Cpath d="M381 42h18V24h-18v18zm14-16h2v14h-2V26zm-4 0h2v14h-2V26zm-4 0h2v14h-2V26zm-4 0h2v14h-2V26zM395 20v-4h-10v4h-6v2h22v-2h-6zm-2 0h-6v-2h6v2z" style="fill:%23464646;fill-opacity:1"/%3E%3C/g%3E%3C/g%3E%3Cg style="fill:%23bbb" transform="translate(120)"%3E%3Cuse xlink:href="%23a" width="100%25" height="100%25"/%3E%3Cuse xlink:href="%23b" width="100%25" height="100%25"/%3E%3C/g%3E%3Cpath d="M581.65725 30c0 6.078-4.926 11-11 11s-11-4.922-11-11c0-6.074 4.926-11 11-11s11 4.926 11 11z" style="fill:none;stroke:%23464646;stroke-width:2;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"/%3E%3C/svg%3E');
}

.leaflet-control-draw a.active,
.leaflet-control-edit a.active {
  background-color: #ff9090;
}

.leaflet-draw-tooltip {
  display: none;
  position: absolute;
  background: #333;
  color: white;
  opacity: 0.7;
  padding: 5px;
  border: 1px dashed #999;
  font-family: sans-serif;
  font-size: 1em;
  line-height: 1.5;
  z-index: 1000;
}
</style>
