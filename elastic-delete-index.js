//const {Client} = require('@elastic/elasticsearch');
const {Client} = require('@opensearch-project/opensearch');
const configuration = require('./configuration.json');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askForConfirmation() {
  return new Promise((resolve) => {
    rl.question('Are you sure you want to proceed? (yes/no) ', (answer) => {
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
}

(async () => {
  console.log('Deleting elastic index');
  // Init elastic client
  const client = new Client({
    node: 'http://localhost:9200', //This is different from Oni since we are talking to it directly
  });
  // Bootstrap index
  const elastic = configuration['api']['elastic'];
  // Delete
  try {
    const confirmed = await askForConfirmation();
    const res = await client.indices.exists({
      index: elastic['index'] || 'items'
    });
    if (res['statusCode'] !== 404) {
      await client.indices.delete({
        index: elastic['index'] || 'items'
      });
    }
  } catch (e) {
    console.log(e)
    console.log('index does not exist');
  } finally {
    rl.close();
  }

})();
