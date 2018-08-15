import 'regenerator-runtime/runtime'
import cheerio from 'cheerio'

export default function getValuesWithoutConfig (content) {
  return {
    items: content['items'].map(item => getValuesForContent(item, content)),
    pagination: content['pagination']
  }
}

export function getValuesForContent (item, content) {
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
        tempObject.elements[keyElement] = getRichTextModularContent(item.elements[keyElement], content)
      } else {
        tempObject.elements[keyElement] = item.elements[keyElement].value
      }
    }
  }

  return tempObject
}


function getArrayValues (temp, assets, property) {
  temp = []
  assets.value.forEach((item, index) => {
    temp.push(item[property])
  })

  return temp
}

function getRichTextModularContent (data, content) {
  let text = data.value
  const $ = cheerio.load(text)

  data.modular_content.forEach((itemKey, index) => {
    if (content['modular_content'].hasOwnProperty(itemKey)) {
      const item = content['modular_content'][itemKey];
      const value = getValuesForContent(item, content);
      $('object[data-codename="' + itemKey + '"]').attr('value', JSON.stringify(value))
    } else {
      $('object[data-codename="' + itemKey + '"]').attr('value', JSON.stringify(itemKey))
    }
    text = $.html()
  })

  return text.replace('<html><head></head><body>', '').replace('</body></html>', '')
}

function resolveModularContent(data, modularContent) {
  if (data.hasOwnProperty('elements')) {
    for (const key in data.elements) {
      if (data.elements[key].type === 'modular_content') {
        const value = data.elements[key].value.map(codename => {
          if (modularContent.hasOwnProperty(codename)) {
            return modularContent[codename]
          }
          return codename;
        });

        data.elements[key].value = value;
      }
    }
  }

  return data;
}