'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasOwnProperty = undefined;
exports.getRawData = getRawData;
exports.getDeliveryUrlForTypes = getDeliveryUrlForTypes;
exports.getDeliveryUrl = getDeliveryUrl;
exports.getTaxonomiesUrl = getTaxonomiesUrl;
exports.getFullDeliveryUrls = getFullDeliveryUrls;
exports.getContentManagementUrl = getContentManagementUrl;
exports.getMigrationUrl = getMigrationUrl;
exports.isEmptyObject = isEmptyObject;
exports.isObject = isObject;

require('regenerator-runtime/runtime');

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function getRawData(options) {
  const res = await (0, _axios2.default)(options);
  const data = res.data;

  if (data && data.pagination && data.pagination.next_page && options.url.indexOf('limit=') === -1) {
    const nextData = getRawData(Object.assign({}, options, { url: data.pagination.next_page }));
    data.items.concat(nextData.items);
    data.modular_content.concat(data.nextData.modular_content);
  }

  return data;
}

function getDeliveryUrlForTypes(projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/types';
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/types';
  }
}

function getDeliveryUrl(projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/items';
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/items';
  }
}

function getTaxonomiesUrl(projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/taxonomies';
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/taxonomies';
  }
}

function getFullDeliveryUrls(params, projectID, previewKey, isPreview) {
  const options = [];

  if (isPreview && previewKey !== null) {
    params.forEach(item => {
      options.push({
        url: getDeliveryUrl(projectID, isPreview) + item,
        json: true,
        headers: {
          Authorization: 'Bearer ' + previewKey
        }
      });
    });
  } else {
    params.forEach(item => {
      options.push({
        url: getDeliveryUrl(projectID, isPreview) + item,
        json: true
      });
    });
  }
  return options;
}

function getContentManagementUrl(projectID, { id, external_id, language_id, language_code } = {}) {
  let url = 'https://manage.kenticocloud.com/v2/projects/' + projectID + '/items';

  if (id) {
    url += '/' + id;
  } else if (external_id) {
    url += '/external-id/' + external_id;
  }

  if (language_id) {
    url += '/variants/' + language_id;
  } else if (language_code) {
    url += '/variants/codename/' + language_code;
  }

  return url;
}

function getMigrationUrl(projectID, scope) {
  return 'https://api.kenticocloud.com/draft/projects/' + projectID + '/' + scope;
}

const hasOwnProperty = exports.hasOwnProperty = Object.prototype.hasOwnProperty;

function isEmptyObject(obj) {

  // null and undefined are "empty"
  if (obj == null) return true;

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0) return false;
  if (obj.length === 0) return true;

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== 'object') return true;

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) return false;
  }

  return true;
}

function isObject(val) {
  if (val === null) {
    return false;
  }
  return (typeof val === 'function' || typeof val === 'object') && !(val instanceof Array);
}