## Oni UI

### Work in Progress

### How to Run

Pre: To run this first you need an [Arkisto Standard](https://arkisto-platform.github.io) OCFL repository

Current guide applies to Mac and Linux:

1. Install docker application and docker compose (as of 2023, docker compose comes with docker installation)
   1. Mac only: Open docker application (no need to sign in) and give permission for /opt/storage/oni (Gear icon > Resources > File Sharing > Browse > Find /opt on local drive > Select + > Apply & restart)
2. Verify your docker-compose.yml points to the right ocfl repository
   1. Currently, using **Oni** version **1.6.0**
3. Copy `configuration.local.json` to `configuration.json` and modify as you wish
4. Start an Oni
   1. `docker compose up`
   2. Wait for oni to be ready
5. Create a structural index and an elastic index by running:
   1. `npm install`
   2. `node structural-index.js`
   3. `node elastic-ocfl-oni-index.js` (Note: running this will delete all the 'items' index, so if working with notebooks for example, `node elastic-notebook-index.js` would need to be re-run).
   4. GitHub iPython Notebooks
      1. Create a configuration file called notebooks.configuration.json and include `{"key": "GITHUB_ACCESS_TOKEN", "org": "GITHUB_ORG", "binderUrl": "BINDER_URL"}`
         <br>e.g. `{"key": "YOUR_GITHUB_ACCESS_TOKEN", "org": "Australian-Text-Analytics-Platform", "binderUrl": "https://binderhub.example.cloud.edu.au"}`
      2. `node elastic-notebook-index.js` (Note: this will add notebooks to the items index)
   5. Vocabs
      1. To add graph like vocabs run `node vocabs-index.js` this will add a second index called vocabs
      2. Vocabs are searched with exact match first trying https://purl.archive.org/language-data-commons/terms#<<ID>> and then http://schema.org/<<ID>>
6. Develop Portal:
   1. `cd portal`
   2. `npm install`
   3. `npm run dev`
7. Open a browser to [http://localhost:11000](http://localhost:11000)

### TODOs

- Create a production version of the portal
- Create production containers
- Do not use npm link. For that we need to stamp out libraries and remove unused ones

### BinderHub Registry Setup

In configuration.json, `githubToken` requires an API key for BinderHubCard.component.vue to access the Binderhub Registry. Do not save your token.
