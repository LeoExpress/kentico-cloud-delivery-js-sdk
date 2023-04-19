'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.KenticoSDK = undefined;

require('regenerator-runtime/runtime');

var _helper = require('./helpers/helper');

var _getValuesHelper = require('./helpers/getValuesHelper');

var _getValuesHelper2 = _interopRequireDefault(_getValuesHelper);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Initializes object with its Project ID, Preview API Key and Content Management Key that represents a Kentico Cloud project.
 * @constructor Delivery
 * @param {string} projectID Project ID, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/using-delivery-api#section-getting-project-id.
 * @param {string} previewKey Preview API Key, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/preview-content-via-api.
 * @example
 * var project = new Delivery('82594550-e25c-8219-aee9-677f600bad53', 'ew0KICAiYWxnIjo...QvV8puicXQ');
 */
class KenticoSDK {
  constructor(projectID, previewKey, contentManagementKey) {
    this.projectID = projectID;
    this.previewKey = typeof previewKey === 'undefined' ? null : previewKey;
    this.contentManagementKey = typeof contentManagementKey === 'undefined' ? null : contentManagementKey;
  }

  /**
   * Get content items
   * @param query
   * @param isPreview
   * @returns {Promise.<DataTransferItemList|Array>}
   */
  async getContentItems(query, isPreview = false, waitForLoadingNewContent = false) {
    const options = {
      url: (0, _helper.getDeliveryUrl)(this.projectID, isPreview) + '?' + query,
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey,
        waitForLoadingNewContent: String(waitForLoadingNewContent)
      }
    };

    const data = await (0, _helper.getRawData)(options);

    let depth = 0;
    const results = query.match(/&depth=([0-9]+)/);
    if (Array.isArray(results) && results.length > 1) {
      depth = parseInt(results[1]);
    }

    if (typeof data === 'object' && data.items) {
      return (0, _getValuesHelper2.default)(data, depth).items;
    }

    throw new Error('Error getting content types');
  }

  /**
   * Get content types
   * @param isPreview
   * @returns {Promise.<String[]|undefined|t|types|{type}>}
   */
  async getContentTypes(isPreview = false) {
    const options = {
      url: (0, _helper.getDeliveryUrlForTypes)(this.projectID, isPreview),
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey
      }
    };

    const data = await (0, _helper.getRawData)(options);

    if (data && data.types) {
      return data.types;
    }

    throw new Error('Error getting content types');
  }

  /**
   * Create content item
   * @param type
   * @param id
   * @param name
   * @param sitemapLocations
   * @returns Object
   * @throws
   */
  async addContentItem(type, id, name, sitemapLocations = []) {
    const body = {
      'name': name,
      'type': {
        'codename': type
      },
      'sitemapLocations': sitemapLocations.map(sl => ({ codename: sl })),
      'external_id': id
    };

    const options = {
      method: 'POST',
      url: (0, _helper.getContentManagementUrl)(this.projectID),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Update content item
   * @param type
   * @param id
   * @param name
   * @param sitemapLocations
   * @returns Object
   * @throws
   */
  async upsertContentItem(type, id, name, sitemapLocations = []) {
    const body = {
      'name': name,
      'type': {
        'codename': type
      },
      'sitemapLocations': sitemapLocations.map(sl => ({ codename: sl }))
    };

    const options = {
      method: 'PUT',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { external_id: id }),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Delete content item
   * @param id
   * @returns Object
   * @throws
   */
  async deleteContentItem(id) {
    const options = {
      method: 'DELETE',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { external_id: id }),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Delete content item
   * @param id
   * @returns Object
   * @throws
   */
  async deleteContentItemByKenticoId(id) {
    const options = {
      method: 'DELETE',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { id: id }),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Upsert language variant
   * @param id
   * @param language
   * @param data
   * @param external
   * @returns Object
   * @throws
   */
  async upsertLanguageVariant(id, language, data, external = true) {
    const body = {
      elements: data
    };

    const meta = external ? { external_id: id, language_code: language } : { id: id, language_code: language };

    const options = {
      method: 'PUT',
      url: (0, _helper.getContentManagementUrl)(this.projectID, meta),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Delete language variant
   * @param id
   * @param language
   * @returns Object
   * @throws
   */
  async deleteLanguageVariant(id, language) {
    const options = {
      method: 'DELETE',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { id: id, language_code: language }),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Create new version of language variant
   * @param id
   * @param language
   * @returns Object
   * @throws
   */
  async createNewVersionOfLanguageVariant(id, language) {
    const options = {
      method: 'PUT',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { id: id, language_code: language }) + '/new-version',
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    return (0, _helper.getRawData)(options);
  }

  /**
   * Publish language variant
   * @param id
   * @param language
   * @param scheduledTo
   * @returns Object
   * @throws
   */
  async publishLanguageVariant(id, language, scheduledTo = null) {
    const options = {
      method: 'PUT',
      url: (0, _helper.getContentManagementUrl)(this.projectID, { id: id, language_code: language }) + '/publish',
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    if (scheduledTo) {
      options.body = {
        scheduled_to: scheduledTo
      };
    }

    return (0, _helper.getRawData)(options);
  }

  async deleteAllTypeItems(type) {
    const items = await this.getContentItems('system.type=' + type, true, true);

    items.forEach(item => {
      this.deleteContentItemByKenticoId(item.system.id);
    });

    return true;
  }

  /**
   * Get taxonomies
   * @returns Object
   * @throws
   */
  async getTaxonomies() {
    const options = {
      method: 'GET',
      url: (0, _helper.getTaxonomiesUrl)(this.projectID),
      headers: {
        Authorization: 'Bearer ' + this.previewKey
      }
    };

    return (await (0, _axios2.default)(options)).data.taxonomies.map(t => {
      return this.processTaxonomy(t);
    });
  }

  processTaxonomy(taxonomy) {
    return {
      taxonomy_id: taxonomy.system.id,
      name: taxonomy.system.name,
      codename: taxonomy.system.codename,
      nodes: this.processTaxonomyTerms(taxonomy.terms)
    };
  }

  processTaxonomyTerms(terms) {
    return terms.map(t => ({
      taxonomy_node_id: t.codename,
      name: t.name,
      codename: t.codename,
      children: this.processTaxonomyTerms(t.terms)
    }));
  }
}

exports.KenticoSDK = KenticoSDK;
exports.default = KenticoSDK;