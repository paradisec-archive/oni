const configuration = require('./configuration.json');
const fetch = require('node-fetch');

(async () => {
  const apiHost = configuration.api.host;
  const adminToken = configuration.api.tokens.admin;
  const options = {
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  };
  const structuralIndex = await fetch(`${apiHost}/admin/database/index`, options);
  const res = await structuralIndex.json();
  console.log(res);
})();
