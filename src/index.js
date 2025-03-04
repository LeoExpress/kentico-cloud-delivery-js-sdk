import 'regenerator-runtime/runtime'
import {
  getRawData,
  getDeliveryUrlForTypes,
  getDeliveryUrl,
  getContentManagementUrl,
  getTaxonomiesUrl
} from './helpers/helper'
import getValues from './helpers/getValuesHelper'
import axios from 'axios'

/**
 * Initializes object with its Project ID, Preview API Key and Content Management Key that represents a Kentico Cloud project.
 * @constructor Delivery
 * @param {string} projectID Project ID, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/using-delivery-api#section-getting-project-id.
 * @param {string} previewKey Preview API Key, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/preview-content-via-api.
 * @example
 * var project = new Delivery('82594550-e25c-8219-aee9-677f600bad53', 'ew0KICAiYWxnIjo...QvV8puicXQ');
 */
export class KenticoSDK {
  constructor (projectID, previewKey, contentManagementKey) {
    this.projectID = projectID
    this.previewKey = typeof previewKey === 'undefined' ? null : previewKey
    this.contentManagementKey = typeof contentManagementKey === 'undefined' ? null : contentManagementKey
  }

  /**
   * Get content items
   * @param query
   * @param isPreview
   * @returns {Promise.<DataTransferItemList|Array>}
   */
  async getContentItems (query, isPreview = false, waitForLoadingNewContent = false) {
    const options = {
      url: getDeliveryUrl(this.projectID, isPreview) + '?' + query,
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey,
        waitForLoadingNewContent: String(waitForLoadingNewContent)
      }
    }

    const data = await getRawData(options)

    let depth = 0
    const results = query.match(/&depth=([0-9]+)/)
    if (Array.isArray(results) && results.length > 1) {
      depth = parseInt(results[1])
    }

    if (typeof data === 'object' && data.items) {
      return getValues(data, depth).items
    }

    throw new Error('Error getting content types')
  }

  /**
   * Get content types
   * @param isPreview
   * @returns {Promise.<String[]|undefined|t|types|{type}>}
   */
  async getContentTypes (isPreview = false) {
    const options = {
      url: getDeliveryUrlForTypes(this.projectID, isPreview),
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey
      }
    }

    const data = await getRawData(options)

    if (data && data.types) {
      return data.types
    }

    throw new Error('Error getting content types')
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
  async addContentItem (type, id, name, sitemapLocations = []) {
    const body = {
      'name': name,
      'type': {
        'codename': type
      },
      'sitemapLocations': sitemapLocations.map(sl => ({codename: sl})),
      'external_id': id
    }

    const options = {
      method: 'POST',
      url: getContentManagementUrl(this.projectID),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
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
  async upsertContentItem (type, id, name, sitemapLocations = []) {
    const body = {
      'name': name,
      'type': {
        'codename': type
      },
      'sitemapLocations': sitemapLocations.map(sl => ({codename: sl})),
    }

    const options = {
      method: 'PUT',
      url: getContentManagementUrl(this.projectID, {external_id: id}),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
  }

  /**
   * Delete content item
   * @param id
   * @returns Object
   * @throws
   */
  async deleteContentItem (id) {
    const options = {
      method: 'DELETE',
      url: getContentManagementUrl(this.projectID, {external_id: id}),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
  }

  /**
   * Delete content item
   * @param id
   * @returns Object
   * @throws
   */
  async deleteContentItemByKenticoId (id) {
    const options = {
      method: 'DELETE',
      url: getContentManagementUrl(this.projectID, {id: id}),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
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
  async upsertLanguageVariant (id, language, data, external = true) {
    const body = {
      elements: data
    }

    const meta = external ? {external_id: id, language_code: language} : {id: id, language_code: language}

    const options = {
      method: 'PUT',
      url: getContentManagementUrl(this.projectID, meta),
      json: true,
      body: body,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
  }

  /**
   * Delete language variant
   * @param id
   * @param language
   * @returns Object
   * @throws
   */
  async deleteLanguageVariant (id, language) {
    const options = {
      method: 'DELETE',
      url: getContentManagementUrl(this.projectID, {id: id, language_code: language}),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
  }

  /**
   * Create new version of language variant
   * @param id
   * @param language
   * @returns Object
   * @throws
   */
  async createNewVersionOfLanguageVariant (id, language) {
    const options = {
      method: 'PUT',
      url: getContentManagementUrl(this.projectID, {id: id, language_code: language}) + '/new-version',
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options);
  }

  /**
   * Publish language variant
   * @param id
   * @param language
   * @param scheduledTo
   * @returns Object
   * @throws
   */
  async publishLanguageVariant (id, language, scheduledTo = null) {
    const options = {
      method: 'PUT',
      url: getContentManagementUrl(this.projectID, {id: id, language_code: language}) + '/publish',
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    };

    if (scheduledTo) {
      options.body = {
        scheduled_to: scheduledTo
      }
    }

    return getRawData(options);
  }


  async deleteAllTypeItems (type) {
    const items = await this.getContentItems('system.type=' + type, true, true)

    items.forEach(item => {
      this.deleteContentItemByKenticoId(item.system.id)
    })

    return true
  }

  /**
   * Get taxonomies
   * @returns Object
   * @throws
   */
  async getTaxonomies () {
    const options = {
      method: 'GET',
      url: getTaxonomiesUrl(this.projectID),
      headers: {
        Authorization: 'Bearer ' + this.previewKey
      }
    }

    return (await axios(options)).data.taxonomies.map(t => {
      return this.processTaxonomy(t)
    })
  }

  processTaxonomy (taxonomy) {
    return {
      taxonomy_id: taxonomy.system.id,
      name: taxonomy.system.name,
      codename: taxonomy.system.codename,
      nodes: this.processTaxonomyTerms(taxonomy.terms)
    }
  }

  processTaxonomyTerms (terms) {
    return terms.map(t => ({
      taxonomy_node_id: t.codename,
      name: t.name,
      codename: t.codename,
      children: this.processTaxonomyTerms(t.terms)
    }))
  }
}

export {
  KenticoSDK as default
}
