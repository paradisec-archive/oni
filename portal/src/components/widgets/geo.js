/** Geo format transformation utils */
import {Geometry} from './geo_wkt';
import {GeoShape, GeoCoordinates} from './geo_schema';

export default function (L, entity) {
  const Transformers = {
    GeoCoordinates: GeoCoordinates(L),
    GeoShape: GeoShape(L),
    Geometry: Geometry(L),
  };
  Transformers['http://www.opengis.net/ont/geosparql#Geometry'] = Transformers[Geometry];

  const transformer = Transformers[entity['@type']];
  if (!transformer) {
    throw new Error(`Unknown shape type ${entity['@type']}`);
  }

  return {
    get shapes() {
      return transformer.shapes;
    },
    fromEntity() {
      return transformer.from(entity);
    },
    toEntity(shape) {
      transformer.to(shape, entity);

      return entity;
    },
  };
}
