declare function MountPaths(workingDirectory: any): {
    workingDirectory: any;
    network: string;
    networkConfigurationFile: string;
    benchmark: string;
    benchmarkCallbacks: string;
    benchmarkConfigurationFile: string;
    cryptographicMaterial: string;
    channels: string;
    chaincodes: string;
    funnelFrom: string;
    funnelTo: string;
    goPath: string;
    reports: string;
};
export default MountPaths;
