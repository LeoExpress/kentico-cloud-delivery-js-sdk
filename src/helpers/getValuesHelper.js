import 'regenerator-runtime/runtime'
import { getArrayValues, getRichTextModularContent } from './helper'

export default function getValuesWithoutConfig (content) {
  return {
    items: content['items'].map(item => getValuesForContent(item, content)),
    pagination: content['pagination']
  }
}

function getValuesForContent (item, content) {
  const tempObject = {
    system: item.system,
    elements: {}
  }

  for (const keyElement in item.elements) {
    var itemType = item.elements[keyElement].type

    if (itemType === 'modular_content') {
      tempObject.elements[keyElement] = []
      for (const itemModular of item.elements[keyElement].value) {
        if (content['modular_content'].hasOwnProperty(itemModular)) {
          tempObject.elements[keyElement].push(getValuesForContent(content['modular_content'][itemModular], content))
        } else {
          tempObject.elements[keyElement].push(itemModular)
        }
      }
    } else {
      if (itemType === 'asset') {
        tempObject.elements[keyElement] = item.elements[keyElement] && item.elements[keyElement].value ? item.elements[keyElement].value : []
      } else if (itemType === 'multiple_choice' || itemType === 'taxonomy') {
        tempObject.elements[keyElement] = getArrayValues(tempObject.elements[keyElement], item.elements[keyElement], 'codename')
      } else if (itemType === 'rich_text' && item.elements[keyElement].modular_content.length > 0) {
        tempObject.elements[keyElement] = getRichTextModularContent(item.elements[keyElement], content['modular_content'])
      } else {
        tempObject.elements[keyElement] = item.elements[keyElement].value
      }
    }
  }

  return tempObject
}
