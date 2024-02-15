// const {Client} = require('@elastic/elasticsearch');
const { Client } = require('@opensearch-project/opensearch');
const {Indexer} = require('./lib/Indexer-remote');
const configuration = require('./configuration.json');
const ocfl = require("@ocfl/ocfl-fs");
const fs = require("fs-extra");
const assert = require("assert");
const fetch = require("node-fetch");

(async () => {
  console.log('Configuring elastic');
  // Init elastic client
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration['api']['elastic'];
  // Delete
  try {
    const index = await client.indices.exists({
      index: elastic['index'] || 'items'
    });
    if (index) {
      await client.indices.delete({
        index: elastic['index'] || 'items'
      });
    }
  } catch (e) {
    console.log('index does not exist, creating');
  }
  // Configure mappings
  await client.indices.create({
    index: elastic['index'],
    body: {
      max_result_window: elastic['max_result_window'],
      mappings: elastic['mappings']
    }
  });
  // Put Settings
  await client.indices.putSettings({
    index: elastic['index'],
    body: elastic['indexConfiguration']
  })
  //Cluster settings
  const settings = {
    "persistent": {
      "search.max_open_scroll_context": elastic?.maxScroll || 5000,
      // "xpack.monitoring.collection.enabled": false
    },
    "transient": {
      "search.max_open_scroll_context": elastic?.maxScroll || 5000
    }
  }
  await client.cluster.putSettings({body: settings});
  const config = await client.cluster.getSettings();
  console.log(JSON.stringify(config));

  // Do we need to skip some collections/objects?
  let skipCollections = [];
  const skipConfiguration = "./index.skip.json"
  if (await fs.exists(skipConfiguration)) {
    skipCollections = await fs.readJson(skipConfiguration, "utf-8");
    assert(Array.isArray(skipCollections), `${skipConfiguration} not an array of strings, please fix.`);
  }
  // Create an Indexer and index collections
  const token = await getOauthToken({
    host: configuration.api.structural.host,
    key: configuration.api.structural.key,
    secret: configuration.api.structural.secret
  });
  const indexer = new Indexer({configuration, client, token});
  if (!token) {
   console.log('No token, exiting');
    process.exit(-1)
  }
  await indexer.findOcflObjects({memberOf: null, conformsTo: indexer.conformsToCollection, skip: skipCollections});
})();

async function getOauthToken({host, key, secret}) {
  try {
    let url = `${host}/oauth/token`;
    console.log(url);
    console.log(key, secret)
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: key,
        client_secret: secret,
        scope: 'read'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 200) {
      const json = await response.json();
      return json['access_token'];
    } else {
      console.log(response)
      return null;
    }
  } catch (e) {
    console.log(e.message);
    return null;
  }
}
