import CaliperConfiguration from "./caliperconfiguration";
export default class NetworkOptions {
    private options;
    private network;
    create(caliperConfiguration: CaliperConfiguration, cryptoDir: string): void;
    getCryptographicMaterialAbsolutePaths(): string[];
    getCryptographicMaterialSearchPaths(): string[];
    toString(): string;
}
