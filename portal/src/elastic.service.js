import HTTPService from "./http.service";
import * as esb from 'elastic-builder';
import {isEmpty, first} from 'lodash';

export default class ElasticService {
  constructor({router, configuration}) {
    this.router = router;
    this.searchRoute = '/search/index-post';
    this.indexRoute = '/items';
    this.scrollRoute = '/search/scroll';
    this.aggs = this.prepareAggregations(configuration.ui.aggregations)
    this.highlightFields = configuration.ui.searchHighlights;
    this.fields = configuration.ui.searchFields;
  }

  prepareAggregations(aggregations) {
    const a = {};
    for (let agg of aggregations) {
      a[agg['name']] = {"terms": {"field": agg['field'], "size": 1000}};
    }
    return a;
  }

  async scroll(scrollId) {
    try {
      const httpService = new HTTPService({router: this.router, loginPath: '/login'});
      let route = `${this.scrollRoute}?id=${scrollId}`;
      let response = await httpService.get({route});
      if (response.status !== 200) {
        //httpService.checkAuthorised({status: response.status});
        return {error: response.statusText};
      } else {
        const results = await response.json();
        console.log(results);
        return results;
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  async multi({multi, filters, scroll, aggs}) {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    let route = this.searchRoute + this.indexRoute;
    if (scroll) {
      route += '?withScroll=true';
    }
    let body = {
      query: {},
      "sort": {
        "_script": {
          "type": "number",
          "order": "desc",
          "script": {
            "lang": "painless",
            "source": "doc['_isTopLevel.@value.keyword'].size() > 0 ? 1 : 0" // Sorting first by _isTopLevel //doc['@type.keyword'].contains('RepositoryCollection') ? 1 : 0"
          }
        }
      }
    }
    const query = this.boolQuery({searchQuery: multi, fields: this.fields, filters});
    //console.log(query);
    body.highlight = this.highlights(this.highlightFields);
    body.query = query;
    if (aggs) {
      body.aggs = aggs;
    } else {
      body.aggs = this.aggs
    }
    // console.log('multi query')
    console.log(JSON.stringify(body.query));
    let response = await httpService.post({route, body});
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return {error: response.statusText};
    } else {
      const results = await response.json();
      //console.log(results);
      return results;
    }
  }

  async single({index, id, _crateId, _id}) {
    const httpService = new HTTPService({router: this.router, loginPath: '/login'});
    let route = this.searchRoute + this.indexRoute;
    if (index) {
      route = this.searchRoute + '/' + index;
    }
    let body = {
      aggs: this.aggs, // maybe we dont need to send aggregations
      query: {}
    }
    if (_id) {
      body.query = {
        match: {
          _id: decodeURIComponent(_id)
        }
      }
    } else {
      body.query = {
        dis_max: {
          queries: [
            {match: {'@id': decodeURIComponent(id)}},
            {match: {'_crateId': decodeURIComponent(_crateId)}}
          ]
        }
      }
    }

    // const query = this.boolQuery({ fields: this.fields, filters:[] });
    console.log(JSON.stringify(body.query));
    // body.highlight = this.highlights(this.highlightFields);
    // body.query.bool.must.push(query);

    let response = await httpService.post({route, body});
    if (response.status !== 200) {
      //httpService.checkAuthorised({status: response.status});
      return {error: response.statusText};
    } else {
      const results = await response.json();
      console.log(first(results?.hits?.hits));
      return first(results?.hits?.hits);
    }
  }

  async requestNewSearch({scrollId, collectionScrollId}) {
    try {
      const httpService = new HTTPService({router: this.router, loginPath: '/login'});
      if (this.scrollId) {
        await httpService.delete({route: this.scrollRoute + '?id=' + scrollId});
      }
      if (this.collectionScrollId) {
        await httpService.delete({route: this.scrollRoute + '?id=' + collectionScrollId});
      }
    } catch (e) {
      //Swallow if there is no scroll to delete
    }
  }

  boolQuery({searchQuery, fields, filters}) {
    //console.log('bool query');
    const filterTerms = [];
    let boolQueryObj;
    //console.log(JSON.stringify(filters));
    for (let bucket of Object.keys(filters)) {
      if (filters[bucket].length > 0 || (filters[bucket]?.v && filters[bucket].v.length > 0)) {
        //TODO: send the type of field in the filters
        let field = '';
        let type;
        if (!filters[bucket]?.t) {
          field = bucket.concat('.keyword');
        } else {
          type = filters[bucket]?.t;
          field = bucket.concat('.' + type);
        }
        let values = filters[bucket]?.v || filters[bucket];
        //console.log(values)
        filterTerms.push(esb.termsQuery(field, values))
      }
    }
    if (isEmpty(searchQuery) && filterTerms.length > 0) {
      boolQueryObj = esb.boolQuery().must(filterTerms);
    } else if (!isEmpty(searchQuery) && filterTerms.length > 0) {
      let phraseQuery = [];
      for(let f of fields) {
        phraseQuery.push(esb.matchPhraseQuery(f, searchQuery));
      }
      boolQueryObj = esb.boolQuery().should(phraseQuery).must(filterTerms);
    } else if (!isEmpty(searchQuery) && filterTerms.length <= 0) {
      let phraseQuery = [];
      for(let f of fields) {
        phraseQuery.push(esb.matchPhraseQuery(f, searchQuery));
      }
      boolQueryObj = esb.boolQuery().should(phraseQuery);
    } else if (isEmpty(searchQuery) && filterTerms.length <= 0) {
      boolQueryObj = esb.matchAllQuery();
    }

    const esbQuery = esb.requestBodySearch().query(boolQueryObj);

    const query = esbQuery.toJSON().query;
    console.log(JSON.stringify(query));
    return query;
  }

  highlights(highlightFields) {
    const esbQuery = esb.requestBodySearch()
      .query(esb.matchQuery('not', 'important'))
      .highlight(esb.highlight()
        .numberOfFragments(3)
        .fragmentSize(150)
        .fields(highlightFields)
        .preTags('<mark class="font-bold">', highlightFields[0])
        .postTags('</mark>', highlightFields[0])
      );

    const query = esbQuery.toJSON().query;
    const highlight = esbQuery.toJSON().highlight;
    return highlight;
  }
}
