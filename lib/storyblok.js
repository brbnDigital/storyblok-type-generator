"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const storyblok_js_client_1 = __importDefault(require("storyblok-js-client"));
class Storyblok {
    constructor(accessToken) {
        this._accessToken = undefined;
        this._accessToken = accessToken;
        this._connection = new storyblok_js_client_1.default({
            oauthToken: this._accessToken
        }, Storyblok.API_URL);
    }
    Path(path) {
        return `spaces/${this.spaceId}/${path}`;
    }
    GetNameFromComponentGroups(groups, uuid) {
        const exists = groups.filter((group) => group.uuid === uuid);
        if (exists.length)
            return exists[0].name;
        return '';
    }
    async GetComponentGroups() {
        try {
            let data = await this._connection.get(this.Path('component_groups'));
            return data.data.component_groups || [];
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async GetComponents() {
        try {
            let data = await this._connection.get(this.Path('components'));
            return data.data.components || [];
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
    async PullComponents() {
        try {
            if (this._accessToken) {
                const componentGroups = await this.GetComponentGroups();
                const components = await this.GetComponents();
                components.forEach(component => {
                    const groupUUID = component.component_group_uuid;
                    if (groupUUID) {
                        const group = this.GetNameFromComponentGroups(componentGroups, groupUUID);
                        component.component_group_name = group;
                    }
                });
                return components;
            }
            else {
                return Promise.reject("A connection to Storyblok has not been established");
            }
        }
        catch (error) {
            return Promise.reject(error);
        }
    }
}
exports.default = Storyblok;
Storyblok.API_URL = "https://api.storyblok.com/v1";
