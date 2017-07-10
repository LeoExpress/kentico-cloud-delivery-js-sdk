var settings = require('./settings');
var helpers = require('./helpers');
var request = require('request');
var requestPromise = require('request-promise');
var Promise = require('bluebird');

'use strict';

/**
 * Initilizes object with its Project ID that represents a Kentico Cloud project.
 * @constructor Delivery
 * @param {string} projectID Project ID, see details in the Kentico Cloud Developers Hub: https://developer.kenticocloud.com/docs/using-delivery-api#section-getting-project-id.
 * @example
 * var project = new Delivery('82594550-e25c-8219-aee9-677f600bad53');
 */
function Delivery(projectID) {
  this.projectID = projectID;
};


/**
 * Returns promise with data specified by array of params.
 * @method getContentAsPromise
 * @param {array} params Filtering url parameters that are used for requesting Kentico Cloud storage. See deatils about filtering url parameters: https://developer.kenticocloud.com/v1/reference#delivery-api
 * @return {promise} Returns promise with array of responses for each passed parameter from the Kentico Cloud storage.
 * @example
 * // returns [{items: [...]}, {items: [...]}]
 * project.getContentAsPromise(['?system.type=navigation', '?system.type=homepage'])
 */
Delivery.prototype.getContentAsPromise = function(params) {
  var options = helpers.getFullDeliveryUrls(params, this.projectID);

  return Promise.map(options, (item) => {
    return requestPromise(item);
  });
};


/**
 * Returns object where each content item is assigned to one category according to their position in given arrays. Number of content items and categories must match.
 * @method categorizeContent
 * @param {array} content Content items returned from the "getContentAsPromise" method.
 * @param {array} categories Names of categories.
 * @return {object} Returns object where contect items are property values and categories are property name oereder by their position in given arrays.
 * @example
 * // returns {navigation: {items: [...]}, homepage: {items: [...]}}
 * project.getContentAsPromise(['?system.type=navigation', '?system.type=homepage'])
 * .then(function (data) {
 *   return project.categorizeContent(data, ['navigation', 'homepage']);
 * })
 */
Delivery.prototype.categorizeContent = function(content, categories) {
  if (content.length !== categories.length) {
    return Promise.reject('Number of content items and categories must be equal. Current number of content items is ' + content.length + '. Current number of categories is ' + categories.length + '.');
  }

  var categorizedContent = {};
  content.forEach((item, index) => {
    if (typeof categories[index] !== 'string') {
      return Promise.reject('Category must be a string. Category that in not a string is on index ' + index + ' and has value of ' + categories[index] + '.');
    }
    categorizedContent[categories[index]] = item;
  });

  return categorizedContent;
};


/**
 * Returns values from content items according to given config object.
 * Covers content types: Text, Rich text, Number, Multiple choice, Date & time, Asset, Modular content, URL slug,Taxonomy
 * @method getNeededValues
 * @param {array} content Categorized content items returned from the "categorizeContent" method.
 * @param {object} config Model that descibes values you beed to get from the content parameter.
 * @return {object} Returns content items values that are structured according to the config parameter.
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
 * project.getContentAsPromise(['?system.type=home', '?system.type=blog_post'])
 * .then(function (data) {
 *   return project.categorizeContent(data, ['hompage', 'blog']);
 * }).then(function (data) {
 *   return project.getValues(data, {
 *     homepage: {
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
 * );
 */
Delivery.prototype.getValues = function(content, config) {

  /* This is a monster method that interates through the whole response and transforms it according to given config */

  if (typeof content !== 'object') {
    return Promise.reject('Content must be a categorized object.');
  }

  if (helpers.isEmptyObject(config)) {
    return Promise.reject('Config must be provided.');
  }

  var neededValues = {};

  //Iterate categories
  Object.keys(config).forEach(function(keyContent, indexContent) {
    neededValues[keyContent] = {};
    neededValues[keyContent]['items'] = [];

    if (typeof content[keyContent] === 'undefined') {
      return Promise.reject('Given category "' + keyContent + '" seems to be missing an object from Kentico Cloud as it is missing the "items" property.');
    }

    //Iterate all items in category
    content[keyContent]['items'].forEach((item, index) => {
      let tempObject = {};

      //Iterate categories in config object
      Object.keys(config[keyContent]).forEach(function(keyElement, indexElement) {

        //Add pagination
        if (keyElement === 'pagination' && config[keyContent][keyElement] === true && typeof neededValues[keyContent]['pagination'] === 'undefined') {
          neededValues[keyContent]['pagination'] = content[keyContent].pagination;
        }

        //Add content
        if (keyElement === 'elements') {
          tempObject[keyElement] = {};

          //Iterate category properties in config object
          config[keyContent][keyElement].forEach((itemElement, indexElement) => {

            //Check for errors
            if (typeof item[keyElement][itemElement] === 'undefined' && typeof itemElement === 'string') {
              return Promise.reject('The "' + itemElement + '" property does not exist in the "' + keyContent + '.items.' + keyElement + '" object. Check your config.');
            }

            if (typeof item[keyElement][itemElement['name']] === 'undefined' && typeof itemElement === 'object') {
              return Promise.reject('The "' + itemElement['name'] + '" property does not exist in the "' + keyContent + '.items.' + keyElement + '" object. Check your config.');
            }

            //Get values according to config
            if (keyElement === 'system') {
              //Copy value directly to the temp object
              tempObject[keyElement][itemElement] = item[keyElement][itemElement];
            }

            if (keyElement === 'elements') {

              if (typeof itemElement === 'string' && item[keyElement][itemElement].type === 'asset') {
                //Get urls of all assets in a single array and copy them to temp object
                tempObject[keyElement][itemElement] = helpers.getArrayValues(tempObject[keyElement][itemElement], item[keyElement][itemElement], 'url');
              } else if (typeof itemElement === 'string' && (item[keyElement][itemElement].type === 'multiple_choice' || item[keyElement][itemElement].type === 'taxonomy')) {
                //Get codenames of all selected options in the multiple choice in a single array and copy them to temp object
                tempObject[keyElement][itemElement] = helpers.getArrayValues(tempObject[keyElement][itemElement], item[keyElement][itemElement], 'codename');
              } else if (typeof itemElement === 'object' && item[keyElement][itemElement['name']].type === 'modular_content') {
                tempObject[keyElement][itemElement['name']] = [];

                //Bring modular content vaules to the temp object
                //The logic for modular content item is mostly the same as for regular items

                //Iterate all names of modular items and find their values in the modular_content section
                item[keyElement][itemElement['name']].value.forEach((itemModular, indexModular) => {
                  var tempModularObject = {};

                  Object.keys(itemElement).forEach(function(keyModularElement, indexModularElement) {
                    if (itemElement[keyModularElement] instanceof Array) {
                      tempModularObject[keyModularElement] = {};
                      itemElement[keyModularElement].forEach((itemModularConfig, indexModularConfig) => {
                        //Check for errors
                        if (typeof content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig] === 'undefined') {
                          return Promise.reject('The "' + itemModularConfig + '" property does not exist in the "' + keyContent + '.modular_content.' + itemModular + '.' + keyModularElement + '" object. Check your config.');
                        }

                        //Get values according to config
                        if (keyModularElement === 'system') {
                          tempModularObject[keyModularElement][itemModularConfig] = content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig];
                        }

                        if (keyModularElement === 'elements') {
                          if (content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig].type === 'asset') {
                            tempModularObject[keyModularElement][itemModularConfig] = helpers.getArrayValues(tempModularObject[keyModularElement][itemModularConfig], content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig], 'url');
                          } else if (content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig].type === 'multiple_choice' ||
                            content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig].type === 'taxonomy') {
                            tempModularObject[keyModularElement][itemModularConfig] = helpers.getArrayValues(tempModularObject[keyModularElement][itemModularConfig], content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig], 'codename');
                          } else {
                            tempModularObject[keyModularElement][itemModularConfig] = content[keyContent]['modular_content'][itemModular][keyModularElement][itemModularConfig].value;
                          }
                        }

                      });
                    }
                  });
                  tempObject[keyElement][itemElement['name']].push(tempModularObject);
                });
              } else {
                //Copy value directly to the temp object. Covers content types: Text, Rich text, Number, Date & time, URL slug
                tempObject[keyElement][itemElement] = item[keyElement][itemElement].value;
              }
            }
          });
        }
      });
      neededValues[keyContent]['items'].push(tempObject);
    });
  });
  return neededValues;
};


module.exports = Delivery;
