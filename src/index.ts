import fs from "fs"
import path from "path"

import { format } from "prettier"
import { compile } from "json-schema-to-typescript"
import camelcase from "camelcase"
import Storyblok from "./storyblok"

type Options = {
    outputFile?: string
    namespace?: string
    exports?: boolean
}

export default class StoryblokTypeGenerator {

    private static DEFAULTS: Partial<Options> = {
        namespace: "Storyblok",
        outputFile: "src/generated/storyblok.d.ts",
        exports: false
    }

    private _client: Storyblok
    private _options: Options

    private _schema: any[] = []
    private _groupUUIDs: any
    private _components: any

    private constructor(accessToken: string) {

        this._client = new Storyblok(accessToken)

    }

    public static async Connect(accessToken: string): Promise<StoryblokTypeGenerator> {

        return new StoryblokTypeGenerator(accessToken)

    }

    public async Generate(spaceId: number | string, options?: Options) {

        this._client.spaceId = spaceId
        this._options = {...StoryblokTypeGenerator.DEFAULTS, ...options}

        try {

            this._groupUUIDs = {}
            this._components  = await this._client.PullComponents()

            this._components.forEach(value => {
                if(value.component_group_uuid) {
                    if (!this._groupUUIDs[value.component_group_uuid]) {
                        this._groupUUIDs[value.component_group_uuid] = []
                    }
                    this._groupUUIDs[value.component_group_uuid].push(camelcase(value.name, {
                        pascalCase: true
                    }))
                }
            })

            await this.GenerateSchema()

            let output = this._schema.join("\n")

            if(this._options.namespace) {
                output = `namespace ${this._options.namespace} {

                    ${output}

                }`
            }

            if(!this._options.exports) {
                output = output.replaceAll("export ", "")
            }

            output = format(output, {
                parser: "typescript"
            })

            this.WriteFile(output)
            

        } catch(error) {

            return Promise.reject(error)

        }

    }

    private WriteFile(data: string) {

        const dirname: string = path.dirname(this._options.outputFile)

        if(!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname, { recursive: true })
        }

        fs.writeFileSync(this._options.outputFile, data)

    }

    private async GenerateSchema() {

        for(const values of this._components) {

            const obj: any = {}

            obj.$id = `#/${values.name}`
            obj.title = values.name
            obj.type = 'object'
            obj.properties = this.TypeMapper(values.schema, obj.title)
            obj.properties._uid = {
                type: 'string'
            }

            obj.properties.component = {
                type: 'string',
                enum: [values.name]
            }

            if (values.name === 'global' || values.name === 'page') {
                obj.properties.uuid = {
                    type: 'string'
                }
            }

            const requiredFields = ['_uid', 'component']

            Object.keys(values.schema).forEach(key => {
                if (values.schema[key].required) {
                    requiredFields.push(key)
                }
            })

            if (requiredFields.length) {
                obj.required = requiredFields
            }

            try {

                const ts = await compile(obj, values.name, {
                    unknownAny: false,
                    bannerComment: '',
                    unreachableDefinitions: true
                })

                this._schema.push(ts)

            } catch (error) {

                return Promise.reject(error)

            }

        }

    }

    private TypeMapper(schema: any, title: string) {

        const parseObj: any = {}

        Object.keys(schema).forEach(key => {

            const obj: any = {}
            const schemaElement = schema[key]
            const type = schemaElement.type

            if(type === "multilink") {

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
                })

            } else if(type === "asset") {

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
                })

            } else if(type === "multiasset") {

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
                })

            }

            const schemaType = this.ParseType(type)

            if(!schemaType) return

            obj[key] = {
                type: schemaType
            }

            if (schemaElement.options && schemaElement.options.length) {

                const items = schemaElement.options.map((item: any) => item.value)
        
                if (type === 'option' && schemaElement.exclude_empty_option !== true) {
                    items.unshift('')
                }

                if (schemaType === 'string') {
                    obj[key].enum = items
                } else {
                    obj[key].items = {
                        enum: items
                    }
                }

            }

            if (type === 'bloks') {

                if (schemaElement.restrict_components) {

                    if (schemaElement.restrict_type === 'groups') {

                        if (Array.isArray(schemaElement.component_group_whitelist) && schemaElement.component_group_whitelist.length) {

                            let currentGroupElements = []

                            schemaElement.component_group_whitelist.forEach(groupId => {

                                const currentGroup = this._groupUUIDs[groupId]

                                if (Array.isArray(currentGroup)) {
                                    currentGroupElements = [...currentGroupElements, ...currentGroup]
                                } else {
                                    console.log('Group has no members: ', groupId)
                                }

                            })

                            obj[key].tsType = `(${currentGroupElements.join(' | ')})[]`

                        }

                    } else {

                        if (Array.isArray(schemaElement.component_whitelist) && schemaElement.component_whitelist.length) {

                            obj[key].tsType = `(${schemaElement.component_whitelist.map((i: string) => camelcase(i, { pascalCase: true })).join(' | ')})[]`

                        } else {

                            console.log('No whitelisted component found')

                        }

                    }

                } else {

                    console.log('Type: bloks array but not whitelisted (will result in all elements):', title)

                }

            }

            Object.assign(parseObj, obj)

        })

        return parseObj

    }

    private ParseType (type: string) {
        switch (type) {
            case 'text':
                return 'string'
            case 'bloks':
                return 'array'
            case 'option':
                return 'string'
            case 'options':
                return 'array'
            case 'number':
                return 'number'
            case 'image':
                return 'string'
            case 'boolean':
                return 'boolean'
            case 'textarea':
                return 'string'
            case 'markdown':
                return 'string'
            case 'richtext':
                return 'any'
            case 'datetime':
                return 'string'
            default:
                return null
        }
    }

}
