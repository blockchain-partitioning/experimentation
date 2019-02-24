import * as Path from "path";
import * as Fs from "fs-extra";
import KeyToPath
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath";
import ConfigMap
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap";
import ConfigurationDirectoryTreeVolumes
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes";
import DirectoryTree from "kubechain/src/main/lib/blockchains/fabric/utilities/kubernetes/directorytree/directorytree";
import Options from "kubechain/src/main/lib/blockchains/fabric/options";
import Channel from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/channel/channel";
import ChainCode from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/chaincode/chaincode";
import PeerOrganization
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization";
import ResourceWriter
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/resourcewriter/resourcewriter";
import Node from "kubechain/src/main/lib/kubernetes-sdk/utilities/kinds/cluster/node";
import CrudResource from "kubechain/src/main/lib/kubernetes-sdk/utilities/resources/crud/crud-resource";
import * as KubernetesClient from "kubernetes-client";
import EnvVar from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar";

import TestRunnerDeployment from "./deployment";
import RootTestRunnerConfiguration from "./testrunnerconfiguration";
import DockerService from "../../shared/docker-access/docker-service";
import NetworkOptions from "../../shared/test-runner/networkoptions";
import DockerDaemonset from "../../shared/docker-access/docker-daemonset";
import TestRunnerLoadBalanceService from "../../shared/test-runner/testrunnerloadbalanceservice";
import CaliperConfiguration from "../../shared/test-runner/caliperconfiguration";
import MountPaths from "../../shared/test-runner/mountpaths";
import TestRunnerNamespace from "../../shared/namespace/test-runner";

export default class ResourceCreator {
    private options: Options;
    private workloads: any[];
    private resources: any[];
    private cryptographicMaterialResources: ConfigurationDirectoryTreeVolumes<ConfigMap>[];
    private cryptographicMaterialAbsolutePaths: string[];
    private searchPaths: string[];
    private networkConfiguration: ConfigMap;
    private channels: Channel[];
    private chainCode: ChainCode;
    private peerOrganizationUtil: PeerOrganization;
    private writer: ResourceWriter;
    private testRunnerConfiguration: RootTestRunnerConfiguration;
    private benchmarkConfiguration: ConfigMap;
    private benchmarkPath: string;
    private mountPaths: { workingDirectory: any; network: string; networkConfigurationFile: string; benchmark: string; benchmarkCallbacks: string; benchmarkConfigurationFile: string; cryptographicMaterial: string; channels: string; chaincodes: string; funnelFrom: string; funnelTo: string; goPath: string; reports: string };
    private namespace: string;

    constructor(options: Options) {
        this.options = options;
        this.workloads = [];
        this.resources = [];
        this.peerOrganizationUtil = new PeerOrganization(this.options);
        this.writer = new ResourceWriter(undefined);
        this.mountPaths = MountPaths(Path.posix.join(Path.posix.sep, "test-runner"));
        this.namespace = "test-runner";
    }

    async start(configuration: CaliperConfiguration, testRunnerConfiguration: RootTestRunnerConfiguration, benchmarkPath: string) {
        this.testRunnerConfiguration = testRunnerConfiguration;
        this.benchmarkPath = benchmarkPath;
        this.createDockerApiAccessResources();
        await this.createTestRunnerResources(configuration);
    }

    private createDockerApiAccessResources() {
        this.workloads.push({
            path: undefined,
            name: "docker-http-daemonset",
            resource: new DockerDaemonset()
        });

        this.resources.push({
            path: undefined,
            name: "docker-http-service",
            resource: new DockerService()
        });
    }

    private async createTestRunnerResources(configuration: CaliperConfiguration) {
        this.createNamespace();
        this.createTestRunnerConfigurationResources(configuration);
        await this.createTestInitiatorDeployment();
        this.createTestRunnerService();
    }

    private createNamespace() {
        this.resources.push({
            path: undefined,
            name: "test-runner-namespace",
            resource: new TestRunnerNamespace()
        });
    }

    private createTestRunnerConfigurationResources(configuration: CaliperConfiguration) {
        this.createNetworkConfigurationResource(configuration);
        this.createBenchmarkConfiguration();
        this.createCryptographicMaterialResources();
        this.createChannelResources();
        this.createChainCodeResources();
        this.createTestRunnerService();
    }

    private createNetworkConfigurationResource(configuration: CaliperConfiguration) {
        const networkOptions = new NetworkOptions();
        networkOptions.create(configuration, this.mountPaths.cryptographicMaterial);
        this.cryptographicMaterialAbsolutePaths = networkOptions.getCryptographicMaterialAbsolutePaths();
        this.searchPaths = networkOptions.getCryptographicMaterialSearchPaths();
        this.networkConfiguration = new ConfigMap('test-runner-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", networkOptions.toString());
        this.networkConfiguration.addItem(new KeyToPath("network.json", "network.json"));

        this.resources.push({
            path: undefined,
            name: "test-runner-network-configuration",
            resource: this.networkConfiguration
        });
    }

    private createBenchmarkConfiguration() {
        this.benchmarkConfiguration = new ConfigMap('test-runner-benchmark-configuration', this.namespace);
        this.benchmarkConfiguration.addDataPair("benchmark.json", JSON.stringify(Fs.readJsonSync(Path.resolve(__dirname, Path.join(this.benchmarkPath, "configuration.json")))));
        this.benchmarkConfiguration.addItem(new KeyToPath("benchmark.json", "benchmark.json"));

        this.resources.push({
            path: undefined,
            name: "test-runner-benchmark-configuration",
            resource: this.benchmarkConfiguration
        });
    }

    private createCryptographicMaterialResources() {
        this.cryptographicMaterialResources = [this.options.get('$.blockchain.organizations.paths.peerorganizations'),
            this.options.get('$.blockchain.organizations.paths.ordererorganizations')
        ].map((path: string) => {
            const directoryTree = new DirectoryTree(path);
            const configurationDirectoryTree = directoryTree.convertToConfigMapDirectoryTree(this.namespace);
            return new ConfigurationDirectoryTreeVolumes<ConfigMap>(configurationDirectoryTree);
        });
    }

    private createChannelResources() {
        this.chainCode = this.peerOrganizationUtil.createChainCode({id: "simple-addition-chaincode"}, this.namespace);
        this.chainCode.addToWriter(this.writer, this.options.get('$.kubernetes.paths.postlaunch'));
    }

    private createChainCodeResources() {
        this.channels = this.peerOrganizationUtil.createChannels(this.writer, this.namespace, this.options.get('$.kubernetes.paths.postlaunch'));
    }

    private async createTestInitiatorDeployment() {
        const deployment = new TestRunnerDeployment(this.options);
        this.workloads.push({
            path: undefined,
            name: "test-runner-deployment",
            resource: deployment
        });

        await this.addDockerMonitorUrlsToTestInitiator(deployment);
        this.mountTestInitiatorConfiguration(deployment);
        this.addTestInitiatorConfigurationVolumes(deployment);
    }

    private async addDockerMonitorUrlsToTestInitiator(deployment: TestRunnerDeployment) {
        const nodeUrls = await this.getDockerMonitorUrls();
        deployment.addEnvironmentVariable(new EnvVar("NODES_TO_WATCH", JSON.stringify(nodeUrls)));
        deployment.addEnvironmentVariable(new EnvVar("CHILDREN", JSON.stringify(this.testRunnerConfiguration.childrenIPAddresses)));
        deployment.addEnvironmentVariable(new EnvVar("TRANSACTIONS_PER_SECOND", JSON.stringify(this.testRunnerConfiguration.transactionsPerSecond)));
    }

    private async getDockerMonitorUrls() {
        const response = await this.getNodeIpAddressesFromCluster();
        const requestPath = "all";
        const nodes = response.body.items;
        return nodes.map((node: any) => {
            const nodeAddresses: any[] = node.status.addresses;
            const address = nodeAddresses.find((address) => {
                return address.type === "InternalIP"
            });
            return `http://${address.address}:2375/${requestPath}`;
        });
    }

    private async getNodeIpAddressesFromCluster(): Promise<any> {
        const config = KubernetesClient.config;
        const client = new KubernetesClient.Client({
            config: config.fromKubeconfig(undefined, this.options.get('$.kubernetes.context')),
            version: '1.8'
        });
        const resource = new CrudResource({apiVersion: "v1", metadata: {}}, new Node());
        return resource.getAll(client, {qs: {labelSelector: "node-role.kubernetes.io/node"}});
    }

    private mountTestInitiatorConfiguration(deployment: TestRunnerDeployment) {
        deployment.mountNetworkConfiguration(this.networkConfiguration);
        deployment.mountBenchMarkConfiguration(this.benchmarkConfiguration);
        deployment.mountCryptographicMaterial(this.cryptographicMaterialResources, this.searchPaths);
        deployment.mountChannels(this.channels);
        deployment.mountChaincodes([this.chainCode]);
    }

    private addTestInitiatorConfigurationVolumes(deployment: TestRunnerDeployment) {
        deployment.addConfigurationAsVolume(this.networkConfiguration);
        deployment.addConfigurationAsVolume(this.benchmarkConfiguration);
        deployment.addCryptographicMaterialAsVolumes(this.cryptographicMaterialResources, this.searchPaths);
        deployment.addChannelsAsVolumes(this.channels);
        deployment.addChainCodesAsVolumes([this.chainCode])
    }

    private createTestRunnerService() {
        const service = new TestRunnerLoadBalanceService("test-runner-loadbancer", this.namespace, this.testRunnerConfiguration.loadBalancerIP);
        this.resources.push({
            name: "test-runner-loadbancer",
            path: undefined,
            resource: service
        })
    }

    write() {
        const outputPath = this.options.get('$.kubernetes.paths.postlaunch');
        this.addResources(outputPath);
        this.writer.write();
    }

    addResources(outputPath: string) {
        this.workloads.forEach((resource) => {
            resource.path = outputPath;
            this.writer.addWorkload(resource);
        });
        this.resources.forEach((resource) => {
            resource.path = outputPath;
            this.writer.addResource(resource);
        });
        this.cryptographicMaterialResources.forEach((volumes) => {
            this.cryptographicMaterialAbsolutePaths.forEach(searchPath => {
                volumes.findAndAddToWriter(searchPath, this.writer, outputPath);
            })
        });
    }
}