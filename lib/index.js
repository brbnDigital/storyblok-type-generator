"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prettier_1 = require("prettier");
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const camelcase_1 = __importDefault(require("camelcase"));
const storyblok_1 = __importDefault(require("./storyblok"));
class StoryblokTypeGenerator {
    constructor(accessToken) {
        this._schema = [];
        this._client = new storyblok_1.default(accessToken);
    }
    static async Connect(accessToken) {
        return new StoryblokTypeGenerator(accessToken);
    }
    async Generate(spaceId, options) {
        this._client.spaceId = spaceId;
        this._options = { ...StoryblokTypeGenerator.DEFAULTS, ...options };
        try {
            this._groupUUIDs = {};
            this._components = await this._client.PullComponents();
            this._components.forEach(value => {
                if (value.component_group_uuid) {
                    if (!this._groupUUIDs[value.component_group_uuid]) {
                        this._groupUUIDs[value.component_group_uuid] = [];
                    }
                    this._groupUUIDs[value.component_group_uuid].push((0, camelcase_1.default)(value.name, {
                        pascalCase: true
                    }));
                }
            });
            await this.GenerateSchema();
            let output = this._schema.join("\n");
            if (this._options.namespace) {
                output = `namespace ${this._options.namespace} {

                    ${output}

                }`;
            }
            if (!this._options.exports) {
                output = output.replaceAll("export ", "");
            }
            output = (0, prettier_1.format)(output, {
                parser: "typescript"
            });
            this.WriteFile(output);
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    WriteFile(data) {
        const dirname = path_1.default.dirname(this._options.outputFile);
        if (!fs_1.default.existsSync(dirname)) {
            fs_1.default.mkdirSync(dirname, { recursive: true });
        }
        fs_1.default.writeFileSync(this._options.outputFile, data);
    }
    async GenerateSchema() {
        for (const values of this._components) {
            const obj = {};
            obj.$id = `#/${values.name}`;
            obj.title = values.name;
            obj.type = 'object';
            obj.properties = this.TypeMapper(values.schema, obj.title);
            obj.properties._uid = {
                type: 'string'
            };
            obj.properties.component = {
                type: 'string',
                enum: [values.name]
            };
            if (values.name === 'global' || values.name === 'page') {
                obj.properties.uuid = {
                    type: 'string'
                };
            }
            const requiredFields = ['_uid', 'component'];
            Object.keys(values.schema).forEach(key => {
                if (values.schema[key].required) {
                    requiredFields.push(key);
                }
            });
            if (requiredFields.length) {
                obj.required = requiredFields;
            }
            try {
                const ts = await (0, json_schema_to_typescript_1.compile)(obj, values.name, {
                    unknownAny: false,
                    bannerComment: '',
                    unreachableDefinitions: true
                });
                this._schema.push(ts);
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
    }
    TypeMapper(schema, title) {
        const parseObj = {};
        Object.keys(schema).forEach(key => {
            const obj = {};
            const schemaElement = schema[key];
            const type = schemaElement.type;
            if (type === "multilink") {
                Object.assign(parseObj, {
                    [key]: {
                        'oneOf': [{
                                type: 'object',
                                properties: {
                                    cached_url: {
                                        type: 'string'
                                    },
                                    linktype: {
                                        type: 'string'
                                    }
                                }
                            },
                            {
                                type: 'object',
                                properties: {
                                    id: {
                                        type: 'string'
                                    },
                                    cached_url: {
                                        type: 'string'
                                    },
                                    linktype: {
                                        type: 'string',
                                        enum: ['story']
                                    }
                                }
                            },
                            {
                                type: 'object',
                                properties: {
                                    url: {
                                        type: 'string'
                                    },
                                    cached_url: {
                                        type: 'string'
                                    },
                                    linktype: {
                                        type: 'string',
                                        enum: ['asset', 'url']
                                    }
                                }
                            },
                            {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string'
                                    },
                                    linktype: {
                                        type: 'string',
                                        enum: ['email']
                                    }
                                }
                            }]
                    }
                });
            }
            else if (type === "asset") {
                Object.assign(parseObj, {
                    [key]: {
                        type: 'object',
                        required: ['id', 'filename', 'name'],
                        properties: {
                            alt: {
                                type: 'string'
                            },
                            copyright: {
                                type: 'string'
                            },
                            id: {
                                type: 'number'
                            },
                            filename: {
                                type: 'string'
                            },
                            name: {
                                type: 'string'
                            },
                            title: {
                                type: 'string'
                            }
                        },
                        additionalProperties: false
                    }
                });
            }
            else if (type === "multiasset") {
                Object.assign(parseObj, {
                    [key]: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['id', 'filename', 'name'],
                            properties: {
                                alt: {
                                    type: 'string'
                                },
                                copyright: {
                                    type: 'string'
                                },
                                id: {
                                    type: 'number'
                                },
                                filename: {
                                    type: 'string'
                                },
                                name: {
                                    type: 'string'
                                },
                                title: {
                                    type: 'string'
                                }
                            },
                            additionalProperties: false
                        }
                    }
                });
            }
            const schemaType = this.ParseType(type);
            if (!schemaType)
                return;
            obj[key] = {
                type: schemaType
            };
            if (schemaElement.options && schemaElement.options.length) {
                const items = schemaElement.options.map((item) => item.value);
                if (type === 'option' && schemaElement.exclude_empty_option !== true) {
                    items.unshift('');
                }
                if (schemaType === 'string') {
                    obj[key].enum = items;
                }
                else {
                    obj[key].items = {
                        enum: items
                    };
                }
            }
            if (type === 'bloks') {
                if (schemaElement.restrict_components) {
                    if (schemaElement.restrict_type === 'groups') {
                        if (Array.isArray(schemaElement.component_group_whitelist) && schemaElement.component_group_whitelist.length) {
                            let currentGroupElements = [];
                            schemaElement.component_group_whitelist.forEach(groupId => {
                                const currentGroup = this._groupUUIDs[groupId];
                                if (Array.isArray(currentGroup)) {
                                    currentGroupElements = [...currentGroupElements, ...currentGroup];
                                }
                                else {
                                    console.log('Group has no members: ', groupId);
                                }
                            });
                            obj[key].tsType = `(${currentGroupElements.join(' | ')})[]`;
                        }
                    }
                    else {
                        if (Array.isArray(schemaElement.component_whitelist) && schemaElement.component_whitelist.length) {
                            obj[key].tsType = `(${schemaElement.component_whitelist.map((i) => (0, camelcase_1.default)(i, { pascalCase: true })).join(' | ')})[]`;
                        }
                        else {
                            console.log('No whitelisted component found');
                        }
                    }
                }
                else {
                    console.log('Type: bloks array but not whitelisted (will result in all elements):', title);
                }
            }
            Object.assign(parseObj, obj);
        });
        return parseObj;
    }
    ParseType(type) {
        switch (type) {
            case 'text':
                return 'string';
            case 'bloks':
                return 'array';
            case 'option':
                return 'string';
            case 'options':
                return 'array';
            case 'number':
                return 'number';
            case 'image':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'textarea':
                return 'string';
            case 'markdown':
                return 'string';
            case 'richtext':
                return 'any';
            case 'datetime':
                return 'string';
            default:
                return null;
        }
    }
}
exports.default = StoryblokTypeGenerator;
StoryblokTypeGenerator.DEFAULTS = {
    namespace: "Storyblok",
    outputFile: "src/generated/storyblok.d.ts",
    exports: false
};
