declare type Options = {
    outputFile?: string;
    namespace?: string;
    exports?: boolean;
};
export default class StoryblokTypeGenerator {
    private static DEFAULTS;
    private _client;
    private _options;
    private _schema;
    private _groupUUIDs;
    private _components;
    private constructor();
    static Connect(accessToken: string): Promise<StoryblokTypeGenerator>;
    Generate(spaceId: number | string, options?: Options): Promise<never>;
    private WriteFile;
    private GenerateSchema;
    private TypeMapper;
    private ParseType;
}
export {};
