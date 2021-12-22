const { getUser } = require('../controllers/user');
const { getTeamMembership, filterMemberships } = require('../services/github');
const { createUserMemberships } = require('../controllers/userMembership');

async function getGithubMemberships({ userId, group }) {

  const user = await getUser({ where: { id: userId } });
  const teamMembership = await getTeamMembership({
    user: {
      username: user.providerUsername,
      accessToken: user.accessToken
    }, group: group
  });
  const memberships = filterMemberships({ teamMembership });
  //TODO: Fix this to return DB not the return the service github
  await createUserMemberships({ memberships, user });
  return memberships;
}

module.exports = {
  getGithubMemberships
}
