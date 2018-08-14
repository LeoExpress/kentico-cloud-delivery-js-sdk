import 'regenerator-runtime/runtime'
import {
  getRawData,
  getDeliveryUrlForTypes,
  getDeliveryUrl,
  getContentManagementUrl,
  getMigrationUrl
} from './helpers/helper'
import getValues from './helpers/getValuesHelper'
import cheerio from 'cheerio'
import requestPromise from 'request-promise'

/**
 * Initializes object with its Project ID, Preview API Key and Content Management Key that represents a Kentico Cloud project.
 * @constructor Delivery
 * @param {string} projectID Project ID, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/using-delivery-api#section-getting-project-id.
 * @param {string} previewKey Preview API Key, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/preview-content-via-api.
 * @example
 * var project = new Delivery('82594550-e25c-8219-aee9-677f600bad53', 'ew0KICAiYWxnIjo...QvV8puicXQ');
 */
export class KenticoSDK {
  constructor (projectID, previewKey, contentManagementKey, migrationKey) {
    this.projectID = projectID
    this.previewKey = typeof previewKey === 'undefined' ? null : previewKey
    this.contentManagementKey = typeof contentManagementKey === 'undefined' ? null : contentManagementKey
    this.migrationKey = typeof migrationKey === 'undefined' ? null : migrationKey
  }

  /**
   * Returns data containing resolved specified Modular content in specified Rich text element.
   * @method resolveModularContentInRichText
   * @param {object} content Data from the Kentico Cloud storage processed by the getValues methods.
   * @param {string} elementName Name of field that represents the Rich text element.
   * @param {string} modularContentCodeName Code name of a modular item that is inside of the Rich text element.
   * @param {string} template Template that gets rendered in the Rich text element. You can render data from the passed content with use of the macros wrapped in { }.
   * @return {object} content with processed Rich text element.
   * @example
   * project.getContent({
   *   home: '?system.type=homepage',
   *   blog: '?system.type=blog_post'
   * })
   * .then(project.getValues)
   * .then((data) => {
   *   data = project.resolveModularContentInRichText(data, 'home', 'rich_content_with_modular_content', 'myCodeName', '<div class="foo">{elements.label}</div><span>{system.id}</span>');
   *   return data;
   * });
   */
  resolveModularContentInRichText (content, elementName, modularContentCodeName, template) {
    content.items.forEach(item => {
      if (typeof item.elements[elementName] !== 'undefined') {
        var $ = cheerio.load(item.elements[elementName])
        var $object = $('object[data-codename="' + modularContentCodeName + '"]')
        var codename = $object.attr('data-codename')
        var data = JSON.parse($object.next('script#' + codename).html())

        var regex = /\{([^}]+)\}/gi
        var result = []
        var indices = []

        while ((result = regex.exec(template))) {
          indices.push(result)

          var objectProperies = result[1].split('.')

          var tempData = data
          objectProperies.forEach((itemProperties, indexProperties) => {
            tempData = tempData[itemProperties]
          })

          var resolvedString = ''
          if (objectProperies[0] === 'elements') {
            resolvedString = tempData.value
          } else {
            resolvedString = tempData
          }

          template = template.replace(result[0], resolvedString)
        }

        $object.next('script#' + codename).remove()
        $object.replaceWith(template)
        item.elements[elementName] = $.html().replace('<html><head></head><body>', '').replace('</body></html>', '')
      }
    })

    return content
  };

  /**
   * Get content items
   * @param query
   * @param isPreview
   * @returns {Promise.<DataTransferItemList|Array>}
   */
  async getContentItems (query, isPreview = false, waitForLoadingNewContent = false) {
    const options = {
      uri: getDeliveryUrl(this.projectID, isPreview) + '?' + query,
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey,
        waitForLoadingNewContent: String(waitForLoadingNewContent)
      }
    }

    const data = await getRawData(options)

    if (typeof data === 'object' && data.items) {
      return getValues(data).items
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
      uri: getDeliveryUrlForTypes(this.projectID, isPreview),
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
      uri: getContentManagementUrl(this.projectID),
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
      sitemap_locations: sitemapLocations
    }

    const options = {
      method: 'PUT',
      uri: getContentManagementUrl(this.projectID, {external_id: id}),
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
      uri: getContentManagementUrl(this.projectID, {external_id: id}),
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
      uri: getContentManagementUrl(this.projectID, {id: id}),
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
   * @returns Object
   * @throws
   */
  async upsertLanguageVariant (id, language, data) {
    const body = {
      elements: data
    }

    const options = {
      method: 'PUT',
      uri: getContentManagementUrl(this.projectID, {external_id: id, language_code: language}),
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
      uri: getContentManagementUrl(this.projectID, {id: id, language_code: language}),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.contentManagementKey
      }
    }

    return getRawData(options)
  }

  async deleteAllTypeItems (type) {
    const items = await this.getContentItems('system.type=' + type, true, true)

    items.forEach(item => {
      this.deleteContentItemByKenticoId(item.system.id)
    })

    return true
  }

  /**
   * Get sitemap locations
   * @returns Object
   * @throws
   */
  async getSitemap () {
    const options = {
      method: 'GET',
      uri: getMigrationUrl(this.projectID, 'sitemap'),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.migrationKey
      }
    }

    return (await requestPromise(options)).nodes
  }

  /**
   * Get taxonomies
   * @returns Object
   * @throws
   */
  async getTaxonomies () {
    const options = {
      method: 'GET',
      uri: getMigrationUrl(this.projectID, 'taxonomy'),
      json: true,
      body: {},
      headers: {
        Authorization: 'Bearer ' + this.migrationKey
      }
    }

    return (await requestPromise(options)).taxonomy_groups
  }
}

export {
  KenticoSDK as default
}
