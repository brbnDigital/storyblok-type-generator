import client from "storyblok-js-client"

export default class Storyblok {

    private static API_URL = "https://api.storyblok.com/v1"

    public spaceId: number | string
    
    private _accessToken: string = undefined
    private _connection: client

    public constructor(accessToken: string) {

        this._accessToken = accessToken

        this._connection = new client({
            oauthToken: this._accessToken
        }, Storyblok.API_URL)

    }

    private Path(path: string) {

        return `spaces/${this.spaceId}/${path}`

    }

    private GetNameFromComponentGroups(groups: any, uuid: string) {

        const exists = groups.filter((group: any) => group.uuid === uuid)
        if (exists.length) return exists[0].name
        return ''

    }

    private async GetComponentGroups(): Promise<any[]> {

        try {

            let data = await this._connection.get(this.Path('component_groups'))
            return data.data.component_groups || []

        } catch(error) {

            return Promise.reject(error)

        }

    }

    private async GetComponents(): Promise<any[]> {

        try {

            let data = await this._connection.get(this.Path('components'))
            return data.data.components || []

        } catch(error) {

            return Promise.reject(error)

        }

    }

    public async PullComponents(): Promise<any> {

        try {

            if(this._accessToken) {

                const componentGroups = await this.GetComponentGroups()
                const components = await this.GetComponents()

                components.forEach(component => {

                    const groupUUID = component.component_group_uuid

                    if(groupUUID) {
                        const group = this.GetNameFromComponentGroups(componentGroups, groupUUID)
                        component.component_group_name = group
                    }

                })

                return components

            } else {

                return Promise.reject("A connection to Storyblok has not been established")

            }

        } catch(error) {

            return Promise.reject(error)

        }

    }

}