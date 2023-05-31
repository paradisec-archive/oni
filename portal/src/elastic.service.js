import HTTPService from "./http.service";
import * as esb from 'elastic-builder';
import {isEmpty, first} from 'lodash';

export default class ElasticService {
  constructor({router, configuration}) {
    this.router = router;
    this.searchRoute = '/search/index';
    this.indexRoute = '/items';
    this.aggs = this.prepareAggregations(configuration.ui.aggregations)
    this.highlightFields = configuration.ui.searchHighlights;
    this.highlighConfig = configuration.ui.hightlight || {};
    this.fields = configuration.ui.searchFields;
  }

  prepareAggregations(aggregations) {
    const a = {};
    for (let agg of aggregations) {
      a[agg['name']] = {"terms": {"field": agg['field'], "size": 1000}};
    }
    return a;
  }


  async multi({multi, filters, aggs, searchFields, sort, order, operation, pageSize, searchFrom}) {
    try {
      const httpService = new HTTPService({router: this.router, loginPath: '/login'});
      let route = this.searchRoute + this.indexRoute;
      let sorting;
      if (sort === 'relevance') {
        sorting = [{
          _score: {
            order: order
          }
        }]
      } else {
        sorting = [{
          _script: {
            type: "number",
            order: order,
            script: {
              lang: 'painless',
              source: `doc['${sort}'].size() > 0 ? 1 : 0`
            }
          }
        }];
        // const sortField = {};
        // sortField[`${sort}.@value.keyword`] = {order};
        // sorting.push(sortField);
      }
      let body = {
        query: {},
        sort: sorting
      }
      // console.log('sorting');
      // console.log(JSON.stringify(sorting));
      const query = this.boolQuery({
        searchQuery: multi,
        fields: searchFields,
        filters,
        operation
      });
      //console.log(query);
      body.highlight = this.highlights(this.highlightFields);
      body.query = query;
      if (aggs) {
        body.aggs = aggs;
      } else {
        body.aggs = this.aggs
      }
      body['size'] = pageSize;
      body['from'] = searchFrom;
      // console.log('multi query')
      // console.log(JSON.stringify(body));
      let response = await httpService.post({route, body})
      if (response.status !== 200) {
        //httpService.checkAuthorised({status: response.status});
        throw new Error(response.statusText);
      } else {
        const results = await response.json();
        //console.log(results);
        return results;
      }
    } catch (e) {
      throw new Error(e.message);
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
      throw new Error(response.statusText);
    } else {
      const results = await response.json();
      console.log(first(results?.hits?.hits));
      return first(results?.hits?.hits);
    }
  }

  boolQuery({searchQuery, fields, filters, operation}) {
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
      for (let [key, value] of Object.entries(fields)) {
        if (value.selected) {
          phraseQuery.push(esb.matchPhraseQuery(key, searchQuery));
        }
      }
      switch (operation) {
        case 'must':
          boolQueryObj = esb.boolQuery().must(phraseQuery).must(filterTerms);
          break;
        case 'should':
          boolQueryObj = esb.boolQuery().should(phraseQuery).must(filterTerms);
          break;
        case 'must_not':
          boolQueryObj = esb.boolQuery().mustNot(phraseQuery).must(filterTerms);
          break;
        default:
          boolQueryObj = esb.boolQuery().should(phraseQuery).must(filterTerms);
      }
    } else if (!isEmpty(searchQuery) && filterTerms.length <= 0) {
      let phraseQuery = [];
      for (let [key, value] of Object.entries(fields)) {
        if (value.selected) {
          phraseQuery.push(esb.matchPhraseQuery(key, searchQuery));
        }
      }
      switch (operation) {
        case 'must':
          boolQueryObj = esb.boolQuery().must(phraseQuery);
          break;
        case 'should':
          boolQueryObj = esb.boolQuery().should(phraseQuery);
          break;
        case 'must_not':
          boolQueryObj = esb.boolQuery().mustNot(phraseQuery);
          break;
        default:
          boolQueryObj = esb.boolQuery().should(phraseQuery);
      }
    } else if (isEmpty(searchQuery) && filterTerms.length <= 0) {
      boolQueryObj = esb.matchAllQuery();
    }

    const esbQuery = esb.requestBodySearch().query(boolQueryObj)
    const query = esbQuery.toJSON().query;
    return query;
  }

  highlights(highlightFields) {
    const esbQuery = esb.requestBodySearch()
      .query(esb.matchQuery('not', 'important'))
      .highlight(esb.highlight()
        .numberOfFragments(3)
        .fragmentSize(200)
        .fields(highlightFields)
        .preTags('<mark class="font-bold">', highlightFields[0])
        .postTags('</mark>', highlightFields[0])
      );

    const query = esbQuery.toJSON().query;
    let highlight = esbQuery.toJSON().highlight;
    highlight = {...highlight, ...this.highlighConfig};
    return highlight;
  }
}
