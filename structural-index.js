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
  const url = `${apiHost}/admin/index/structural`;
  const structuralIndex = await fetch(url, {method: 'POST', ...options});
  if (structuralIndex.status === 404) {
    console.log(`Cannot index into ${url}`);
  } else {
    console.log(`Indexing into ${url}`);
    const res = await structuralIndex.json();
    console.log(res);
  }
})();
