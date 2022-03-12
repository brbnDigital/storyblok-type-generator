"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateTypes = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const camelcase_1 = __importDefault(require("camelcase"));
const prettier_1 = __importDefault(require("prettier"));
const json_schema_to_typescript_1 = require("json-schema-to-typescript");
const storyblok_js_client_1 = __importDefault(require("storyblok-js-client"));
const STORYBLOK_API = "https://api.storyblok.com/v1";
const DEFAULT_OPTIONS = {
    outputFile: "src/generated/storyblok.d.ts",
    namespace: "Storyblok"
};
async function GenerateTypes(accessToken, spaceID, options) {
    // Exit if no Access Token or Space ID are provided.
    if (!accessToken || !spaceID)
        return Promise.reject("Access Token and Space ID are required");
    let storyblokSpaceID = spaceID;
    let generatorOptions = { ...DEFAULT_OPTIONS, ...options };
    let groupUUIDs = {};
    let components = [];
    let schema = [];
    let output = "";
    // Establish a connection to the Storyblok API.
    let storyblokClient = new storyblok_js_client_1.default({ oauthToken: accessToken }, STORYBLOK_API);
    await Generate();
    /**
     * Gets the group name of the Blok.
     * @param groups
     * @param uuid
     * @returns string
     */
    function GroupName(groups, uuid) {
        const exists = groups.filter((group) => group.uuid === uuid);
        if (exists.length)
            return exists[0].name;
        return "";
    }
    /**
     * Fetch all available component groups from Storyblok.
     * @returns
     */
    async function GetAllComponentGroups() {
        let data = await storyblokClient.get(`spaces/${storyblokSpaceID}/component_groups`);
        return data.data.component_groups || [];
    }
    /**
     * Fetches all available components from Storyblok.
     * @returns
     */
    async function GetAllComponents() {
        let data = await storyblokClient.get(`spaces/${storyblokSpaceID}/components`);
        return data.data.components || [];
    }
    /**
     *
     * @returns array
     */
    async function Components() {
        const groups = await GetAllComponentGroups();
        const components = await GetAllComponents();
        components.forEach(component => {
            if (component.component_group_uuid) {
                component.component_group_name = GroupName(groups, component.component_group_uuid);
            }
        });
        return components;
    }
    async function Generate() {
        groupUUIDs = {};
        components = await Components();
        components.forEach(component => {
            if (component.component_group_uuid) {
                if (!groupUUIDs[component.component_group_uuid]) {
                    groupUUIDs[component.component_group_uuid] = [];
                }
                groupUUIDs[component.component_group_uuid].push((0, camelcase_1.default)(component.name, {
                    pascalCase: true
                }));
            }
        });
        await GenerateSchema();
        WriteFile();
    }
    async function GenerateSchema() {
        for (const component of components) {
            const obj = {
                $id: `#/${component.name}`,
                title: component.name,
                type: "object",
                required: ['_uid', 'component'],
                properties: { ...Parse(component.schema, component.name), ...{
                        _uid: {
                            type: "string"
                        },
                        component: {
                            type: "string",
                            enum: [component.name]
                        }
                    } }
            };
            Object.keys(component.schema).forEach(key => {
                if (component.schema[key].required) {
                    obj.required.push(key);
                }
            });
            try {
                const type = await (0, json_schema_to_typescript_1.compile)(obj, component.name, {
                    unknownAny: false,
                    bannerComment: "",
                    unreachableDefinitions: true
                });
                schema.push(type);
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
    }
    function Parse(schema, title) {
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
            const schemaType = ParseType(type);
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
                                const currentGroup = groupUUIDs[groupId];
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
    function ParseType(type) {
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
    function FormatOutput() {
        output = schema.join("\n");
        if (generatorOptions.namespace) {
            output = `namespace ${generatorOptions.namespace} { ${output} }`;
        }
        output = prettier_1.default.format(output, {
            parser: "typescript"
        });
    }
    function WriteFile() {
        FormatOutput();
        const dirname = path_1.default.dirname(generatorOptions.outputFile);
        if (!fs_1.default.existsSync(dirname)) {
            fs_1.default.mkdirSync(dirname, { recursive: true });
        }
        fs_1.default.writeFileSync(generatorOptions.outputFile, output);
    }
}
exports.GenerateTypes = GenerateTypes;
