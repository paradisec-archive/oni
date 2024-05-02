const configuration = require('./configuration.json');
const fetch = require('node-fetch');
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
  const confirmed = await askForConfirmation();
  try {
    if (confirmed) {
      const apiHost = configuration.api.host;
      const adminToken = configuration.api.tokens.admin;
      const options = {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      };
      const deleteIndex = await fetch(`${apiHost}/admin/index/structural`, {method: 'DELETE', ...options});
      if (deleteIndex.status === 404) {
        console.log('Index not found, nothing to delete');
      } else {
        const res = await deleteIndex.json();
        console.log(res);
      }
    }
  } catch (e) {
    console.log('Index does not exist');
  } finally {
    rl.close();
  }
})();
