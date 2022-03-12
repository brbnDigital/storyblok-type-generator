export default class Storyblok {
    private static API_URL;
    spaceId: number | string;
    private _accessToken;
    private _connection;
    constructor(accessToken: string);
    private Path;
    private GetNameFromComponentGroups;
    private GetComponentGroups;
    private GetComponents;
    PullComponents(): Promise<any>;
}
