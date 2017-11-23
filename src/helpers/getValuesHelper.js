import helpers from './helper';

/* This is a monster helper that iterates through the whole response and transforms it according to given config */
/* getValuesWithoutConfig returns values for all object properties in returned items */

/* getValuesWithConfig returns values for object properties specified by the config parameter in returned items */

export function getValuesWithoutConfig(content) {
    var neededValues = {};

    console.log(content);

    Object.keys(content).forEach((keyContent, indexContent) => {
        neededValues[keyContent] = {};
        neededValues[keyContent]['items'] = [];

        content[keyContent]['items'].forEach((item, index) => {
            var tempObject = {};

            Object.keys(item).forEach((keyItem, indexItem) => {
                if (keyItem === 'system') {
                    tempObject[keyItem] = item[keyItem];
                }

                if (keyItem === 'elements') {
                    tempObject[keyItem] = {};

                    Object.keys(item[keyItem]).forEach((keyElement, indexElement) => {
                        var itemType = item[keyItem][keyElement].type;

                        if (itemType !== 'modular_content') {
                            if (itemType === 'asset') {
                                tempObject[keyItem][keyElement] = item[keyItem][keyElement] && item[keyItem][keyElement].value ? item[keyItem][keyElement].value : [];
                            } else if (itemType === 'multiple_choice' || itemType === 'taxonomy') {
                                tempObject[keyItem][keyElement] = helpers.getArrayValues(tempObject[keyItem][keyElement], item[keyItem][keyElement], 'codename');
                            } else if (itemType === 'rich_text' && item[keyItem][keyElement].modular_content.length > 0) {
                                tempObject[keyItem][keyElement] = helpers.getRichTextModularContent(item[keyItem][keyElement], content[keyContent]['modular_content']);
                            } else {
                                tempObject[keyItem][keyElement] = item[keyItem][keyElement].value;
                            }
                        } else {
                            tempObject[keyItem][keyElement] = [];
                            item[keyItem][keyElement].value.forEach((itemModular, indexModular) => {
                                var tempModularObject = {};
                                if (content[keyContent]['modular_content'].hasOwnProperty(itemModular)) {
                                    Object.keys(content[keyContent]['modular_content'][itemModular]).forEach((keyModularItem, indexModularItem) => {

                                        if (keyModularItem === 'system') {
                                            tempModularObject[keyModularItem] = content[keyContent]['modular_content'][itemModular][keyModularItem];
                                        }

                                        if (keyModularItem === 'elements') {
                                            tempModularObject[keyModularItem] = {};

                                            Object.keys(content[keyContent]['modular_content'][itemModular][keyModularItem]).forEach((keyModularContentItem, indexModularContentItem) => {
                                                var modularItem = content[keyContent]['modular_content'][itemModular][keyModularItem][keyModularContentItem];
                                                var itemType = modularItem.type;

                                                if (itemType === 'asset') {
                                                    // tempModularObject[keyModularItem][keyModularContentItem] = helpers.getArrayValues(tempModularObject[keyModularItem][keyModularContentItem], content[keyContent]['modular_content'][itemModular][keyModularItem][keyModularContentItem], 'url');
                                                    tempModularObject[keyModularItem][keyModularContentItem] = modularItem && modularItem.value ? modularItem.value : [];
                                                } else if (itemType === 'multiple_choice' || itemType === 'taxonomy') {
                                                    tempModularObject[keyModularItem][keyModularContentItem] = helpers.getArrayValues(tempModularObject[keyModularItem][keyModularContentItem], content[keyContent]['modular_content'][itemModular][keyModularItem][keyModularContentItem], 'codename');
                                                } else {
                                                    tempModularObject[keyModularItem][keyModularContentItem] = content[keyContent]['modular_content'][itemModular][keyModularItem][keyModularContentItem].value;
                                                }
                                            });
                                        }

                                    });
                                    tempObject[keyItem][keyElement].push(tempModularObject);
                                }
                            });
                        }
                    });
                }

            });
            neededValues[keyContent]['items'].push(tempObject);
        });
        neededValues[keyContent]['pagination'] = content[keyContent]['pagination'];
    });

    return neededValues;
}

export function getValuesWithConfig(content, config) {
    var neededValues = {};

    //Iterate categories
    Object.keys(config).forEach((keyContent, indexContent) => {
        neededValues[keyContent] = {};
        neededValues[keyContent]['items'] = [];

        if (typeof content[keyContent] === 'undefined') {
            return Promise.reject('Given category "' + keyContent + '" seems to be missing an object from Kentico Cloud as it is missing the "items" property.');
        }

        //Iterate all items in category
        content[keyContent]['items'].forEach((item, index) => {
            let tempObject = {};

            //Iterate categories in config object
            Object.keys(config[keyContent]).forEach((keyElement, indexElement) => {

                //Add pagination
                if (keyElement === 'pagination' && config[keyContent][keyElement] === true && typeof neededValues[keyContent]['pagination'] === 'undefined') {
                    neededValues[keyContent]['pagination'] = content[keyContent].pagination;
                }

                //Add system
                if (keyElement === 'system') {
                    tempObject[keyElement] = {};

                    //Copy value directly to the temp object
                    config[keyContent][keyElement].forEach((itemSystem, indexSystem) => {
                        tempObject[keyElement][itemSystem] = item[keyElement][itemSystem];
                    });
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
                            } else if (typeof itemElement === 'string' && item[keyElement][itemElement].type === 'rich_text' && item[keyElement][itemElement].modular_content.length > 0) {
                                //Rich text can contain Modular content so get data for each modular contant in the rich text and append <script> tag that contains JSON for the modular content data
                                tempObject[keyElement][itemElement] = helpers.getRichTextModularContent(item[keyElement][itemElement], content[keyContent]['modular_content']);
                            } else if (typeof itemElement === 'object' && item[keyElement][itemElement['name']].type === 'modular_content') {
                                tempObject[keyElement][itemElement['name']] = [];

                                //Bring modular content vaules to the temp object
                                //The logic for modular content item is mostly the same as for regular items

                                //Iterate all names of modular items and find their values in the modular_content section
                                item[keyElement][itemElement['name']].value.forEach((itemModular, indexModular) => {
                                    var tempModularObject = {};

                                    Object.keys(itemElement).forEach((keyModularElement, indexModularElement) => {
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
}
