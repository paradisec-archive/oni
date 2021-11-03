const { ROCrate } = require('ro-crate');
const { readCrate } = require('./ocfl-tools');
const { getLogger } = require("./index");

const log = getLogger();

async function transformURIs({ host, recordId, ocflObject, uridTypes, catalogFilename }) {
  const json = await readCrate(ocflObject, catalogFilename);
  const crate = new ROCrate(json);
  crate.index();
  crate.toGraph();
  log.silly('transformURIs');
  for (const item of crate.getGraph()) {
    const itemType = crate.utils.asArray(item['@type']);
    const updateItems = [];
    for (let type of uridTypes) {
      if (itemType.includes(type)) {
        updateItems.push(item);
      }
    }
    updateItems.forEach((i) => {
      const ref = crate.getItem(i['@id']);
      if (ref) {
        log.silly(ref['@id']);
        crate.changeGraphId(ref, `${ host }/data/item?id=${ recordId }&file=${ ref['@id'] }`);
      }
    });
  }
  return crate.getJson();
}

module.exports = {
  transformURIs: transformURIs
}
