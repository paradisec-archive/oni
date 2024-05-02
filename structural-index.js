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
  const structuralIndex = await fetch(`${apiHost}/admin/index/structural`, {method: 'POST', ...options});
  console.log(structuralIndex.status);
  const res = await structuralIndex.json();
  console.log(res);
})();
