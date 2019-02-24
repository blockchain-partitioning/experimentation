import Options from "kubechain/src/main/lib/blockchains/fabric/options";
import RootTestRunnerConfiguration from "./testrunnerconfiguration";
import CaliperConfiguration from "../../shared/test-runner/caliperconfiguration";
export default class ResourceCreator {
    private options;
    private workloads;
    private resources;
    private cryptographicMaterialResources;
    private cryptographicMaterialAbsolutePaths;
    private searchPaths;
    private networkConfiguration;
    private channels;
    private chainCode;
    private peerOrganizationUtil;
    private writer;
    private testRunnerConfiguration;
    private benchmarkConfiguration;
    private benchmarkPath;
    private mountPaths;
    private namespace;
    constructor(options: Options);
    start(configuration: CaliperConfiguration, testRunnerConfiguration: RootTestRunnerConfiguration, benchmarkPath: string): Promise<void>;
    private createDockerApiAccessResources;
    private createTestRunnerResources;
    private createNamespace;
    private createTestRunnerConfigurationResources;
    private createNetworkConfigurationResource;
    private createBenchmarkConfiguration;
    private createCryptographicMaterialResources;
    private createChannelResources;
    private createChainCodeResources;
    private createTestInitiatorDeployment;
    private addDockerMonitorUrlsToTestInitiator;
    private getDockerMonitorUrls;
    private getNodeIpAddressesFromCluster;
    private mountTestInitiatorConfiguration;
    private addTestInitiatorConfigurationVolumes;
    private createTestRunnerService;
    write(): void;
    addResources(outputPath: string): void;
}