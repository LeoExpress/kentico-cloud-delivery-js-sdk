import 'regenerator-runtime/runtime'
import { isObject, getFullDeliveryUrls, getRawData, isEmptyObject, getDeliveryUrlForTypes } from './helpers/helper'
import { getValuesWithConfig, getValuesWithoutConfig } from './helpers/getValuesHelper'
import cheerio from 'cheerio'

/**
 * Initializes object with its Project ID and Preview API Key that represents a Kentico Cloud project.
 * @constructor Delivery
 * @param {string} projectID Project ID, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/using-delivery-api#section-getting-project-id.
 * @param {string} previewKey Preview API Key, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/preview-content-via-api.
 * @example
 * var project = new Delivery('82594550-e25c-8219-aee9-677f600bad53', 'ew0KICAiYWxnIjo...QvV8puicXQ');
 */
export default class Delivery {
  constructor (projectID, previewKey) {
    this.projectID = projectID
    this.previewKey = typeof previewKey === 'undefined' ? null : previewKey
  }

  /**
   * Returns promise with data from Kentico Cloud storage specified by params.
   * @method getContent
   * @param {(object|array)} params Object or array that contains filtering url parameters that are used for requesting Kentico Cloud storage. Object properties are names for categories. In case array is passed the response must be processed with use of the categorizeContent method. See details about filtering url parameters: https://developer.kenticocloud.com/v1/reference#delivery-api
   * @param {boolean} isPreview Flag that controls whether only published or all items should be requested.
   * @return {promise} with object of responses for each passed parameter from the Kentico Cloud storage.
   * @example
   * // returns
   * // {
   * //   home: {items: [...]},
   * //   nav: {items: [...]}
   * // }
   * project.getContent({
   *   home: '?system.type=homepage',
   *   nav: '?system.type=navigation'
   * }, true)
   */
  async getContent (params, isPreview = false) {
    if (typeof params === 'undefined') {
      throw new Error('Plase, specify the params parameter in the getContent method.')
    }

    const categories = []
    const values = []

    if (isObject(params)) {
      Object.keys(params).forEach((key, index) => {
        categories.push(key)
        values.push(params[key])
      })

      params = values.slice()
    }

    const options = getFullDeliveryUrls(params, this.projectID, this.previewKey, isPreview)

    const data = await getRawData(options)

    if (categories.length > 0) {
      return this.categorizeContent(data, categories)
    } else {
      return data
    }
  };

  /**
   * Returns object where each content item is assigned to one category according to their position in given arrays. Number of content items and categories must match.
   * @method categorizeContent
   * @param {array} content Content items returned from the "getContent" method.
   * @param {array} categories Names of categories.
   * @return {object} where content items are property values and categories are property names ordered by their position in given arrays.
   * @example
   * // returns {navigation: {items: [...]}, homepage: {items: [...]}}
   * project.getContent(['?system.type=navigation', '?system.type=homepage'], false)
   * .then((data) => {
     *   return project.categorizeContent(data, ['navigation', 'homepage']);
     * })
   */
  categorizeContent (content, categories) {
    if (content.length !== categories.length) {
      throw new Error('Number of content items and categories must be equal. Current number of content items is ' + content.length + '. Current number of categories is ' + categories.length + '.')
    }

    var categorizedContent = {}
    content.forEach((item, index) => {
      if (typeof categories[index] !== 'string') {
        throw new Error('Category must be a string. Category that in not a string is on index ' + index + ' and has value of ' + categories[index] + '.')
      }
      categorizedContent[categories[index]] = item
    })

    return categorizedContent
  };

  /**
   * Returns values from content items.
   * Covers content types: Text, Rich text, Number, Multiple choice, Date & time, Asset, Modular content, URL slug, Taxonomy and supports localization.
   * For Rich text elements the method covers: Modular content, images and links with value added as "Web URL". For links added as "Content item" the method returns a &lt;a&gt; tag with empty "href" attribute as it is not possible to identify full url from the Kentico Cloud response.
   * Data of a Modular content which is part of a Rich text element is returned as a &lt;script&gt; tag with data in the JSON format inside. The &lt;script&gt; tag is inserted after the &lt;object&gt; tag which represents position of the Modular content in the default Kentico Cloud response.
   * @method getValues
   * @param {object} content Categorized content items returned from the "categorizeContent" method.
   * @param {object} config Optional. Model that describes values you need to get from the data provided through content parameter. If the config parameter is not present the returned object contains the "system" object for each item and values for each property. It is recommeneded not to use the "config" parameter in most scenarions.
   * @return {object} with structured content items values.
   * @example
   * // Returns
   * // {
   * //   homepage: {
   * //     items: [{
   * //       system: {
   * //         id: '...',
   * //         name: '...'
   * //       },
   * //       elements: {
   * //         page_title: '...',
   * //         header: '...',
   * //         logos: [{
   * //           system: {
   * //             codename: '...'
   * //           },
   * //           elements: {
   * //             image: ['...'],
   * //             url: '...'
   * //           }
   * //         }]
   * //       }
   * //     }
   * //   }],
   * //   blog: {
   * //     items: [{
   * //       system: {
   * //         id: '...',
   * //         name: '...'
   * //       },
   * //       elements: {
   * //         page_title: '...',
   * //         publish_date: '...',
   * //         header_image: ['...', '...']
   * //       }
   * //     },{
   * //       system: {
   * //         id: '...',
   * //         name: '...'
   * //       },
   * //       elements: {
   * //         page_title: '...',
   * //         publish_date: '...',
   * //         header_image: ['...', '...']
   * //       }
   * //    }],
   * //    pagination: {
   * //      skip: ...,
   * //      limit: ...,
   * //      count: ...,
   * //      next_page: '...'
   * //    }
   * // }
   * project.getContent({
   *   home: '?system.type=homepage',
   *   blog: '?system.type=blog_post'
   * })
   * .then((data) => {
   *   return project.getValues(data, {
   *     home: {
   *       system: ['id', 'name'],
   *       elements: ['page_title', 'header', {
   *         name: 'logos',
   *         system: ['codename'],
   *         elements: ['image', 'url']
   *       }]
   *     },
   *     blog: {
   *       system: ['id', 'name'],
   *       elements: ['page_title', 'publish_date', 'header_image'],
   *       pagination: true
   *     }
   *   });
   * });
   */
  getValues (content, config) {
    if (typeof content !== 'object') {
      throw new Error('Content must be a categorized object.')
    }

    if (typeof config === 'undefined') {
      return getValuesWithoutConfig(content)
    } else {
      if (isEmptyObject(config)) {
        throw new Error('Config must be provided.')
      }
      return getValuesWithConfig(content, config)
    }
  };

  /**
   * Returns data containing resolved specified Modular content in specified Rich text element.
   * @method resolveModularContentInRichText
   * @param {object} content Data from the Kentico Cloud storage processed by the getValues methods.
   * @param {string} categoryName Name of a category that has been passed the getContent of categorizeContent methods.
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
  resolveModularContentInRichText (content, categoryName, elementName, modularContentCodeName, template) {
    content[categoryName].items.forEach((item, index) => {
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

  async getContentTypes (isPreview = false) {
    const options = [{
      uri: getDeliveryUrlForTypes(this.projectID, isPreview),
      json: true,
      headers: {
        Authorization: 'Bearer ' + this.previewKey
      }
    }]

    const data = await getRawData(options)

    if (Array.isArray(data) && data[0].hasOwnProperty('types')) {
      return data[0].types
    }

    throw new Error('Error getting content types')
  };
};
