import 'regenerator-runtime/runtime'
import requestPromise from 'request-promise'
import cheerio from 'cheerio'

export async function getRawData (options) {
  const data = await requestPromise(options)

  if (data && data.pagination && data.pagination.next_page && options.uri.indexOf('limit=') === -1) {
    const nextData = getRawData(Object.assign({}, options, {uri: data.pagination.next_page}))
    data.items.concat(nextData.items)
    data.modular_content.concat(data.nextData.modular_content)
  }

  return data
}

export function getDeliveryUrlForTypes (projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/types'
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/types'
  }
}

export function getDeliveryUrl (projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/items'
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/items'
  }
}

export function getTaxonomiesUrl (projectID, isPreview) {
  if (isPreview) {
    return 'https://preview-deliver.kenticocloud.com/' + projectID + '/taxonomies'
  } else {
    return 'https://deliver.kenticocloud.com/' + projectID + '/taxonomies'
  }
}

export function getFullDeliveryUrls (params, projectID, previewKey, isPreview) {
  const options = []

  if (isPreview && previewKey !== null) {
    params.forEach((item) => {
      options.push({
        uri: getDeliveryUrl(projectID, isPreview) + item,
        json: true,
        headers: {
          Authorization: 'Bearer ' + previewKey
        }
      })
    })
  } else {
    params.forEach((item) => {
      options.push({
        uri: getDeliveryUrl(projectID, isPreview) + item,
        json: true
      })
    })
  }
  return options
}

export function getContentManagementUrl (projectID, {id, external_id, language_id, language_code} = {}) {
  let url = 'https://manage.kenticocloud.com/v1/projects/' + projectID + '/items'

  if (id) {
    url += '/' + id
  } else if (external_id) {
    url += '/external-id/' + external_id
  }

  if (language_id) {
    url += '/variants/' + language_id
  } else if (language_code) {
    url += '/variants/codename/' + language_code
  }

  return url
}

export function getMigrationUrl (projectID, scope) {
  return 'https://api.kenticocloud.com/draft/projects/' + projectID + '/' + scope
}

export const hasOwnProperty = Object.prototype.hasOwnProperty

export function isEmptyObject (obj) {

  // null and undefined are "empty"
  if (obj == null) return true

  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length > 0) return false
  if (obj.length === 0) return true

  // If it isn't an object at this point
  // it is empty, but it can't be anything *but* empty
  // Is it empty?  Depends on your application.
  if (typeof obj !== 'object') return true

  // Otherwise, does it have any properties of its own?
  // Note that this doesn't handle
  // toString and valueOf enumeration bugs in IE < 9
  for (var key in obj) {
    if (hasOwnProperty.call(obj, key)) return false
  }

  return true
}

export function isObject (val) {
  if (val === null) {
    return false
  }
  return ((typeof val === 'function') || (typeof val === 'object')) && !(val instanceof Array)
}
