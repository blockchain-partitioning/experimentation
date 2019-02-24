import * as Path from "path";
import * as Fs from "fs-extra";
import ConfigMap
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap";
import Container from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container";
import Channel from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/channel/channel";
import DirectoryTree from "kubechain/src/main/lib/blockchains/fabric/utilities/kubernetes/directorytree/directorytree";
import OpaqueSecret
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/secret/opaquesecret";

import Options from "kubechain/src/main/lib/blockchains/fabric/options";
import PeerOrganization
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization";
import ConfigurationDirectoryTreeVolumes
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes";

import ResourceWriter
    from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/resourcewriter/resourcewriter";
import EnvVar from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar";
import KeyToPath
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath";
import IContainer from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/icontainer";
import ChainCode from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/chaincode/chaincode";
import IVolume from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/ivolume";
import EmptyDirVolume
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/emptydir";
import CrudResource from "kubechain/src/main/lib/kubernetes-sdk/utilities/resources/crud/crud-resource";
import Node from "kubechain/src/main/lib/kubernetes-sdk/utilities/kinds/cluster/node";
import * as KubernetesClient from "kubernetes-client";
import Deployment from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment";
import ContainerPort from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port";
import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";
import PodAntiAffinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity";
import PodAffinityTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term";

import TestRunnerLoadBalanceService from "../../shared/test-runner/testrunnerloadbalanceservice";
import CaliperConfiguration from "../../shared/test-runner/caliperconfiguration";
import MountPaths from "../../shared/test-runner/mountpaths";
import NetworkOptions from "../../shared/test-runner/networkoptions";
import DockerService from "../../shared/docker-access/docker-service";
import DockerDaemonset from "../../shared/docker-access/docker-daemonset";
import BlockEdgeDeployment from "./block-edge/deployment";
import FabricAntiAffinity from "../../shared/affinity/antiaffinityexpressions";
import TestRunnerNamespace from "../../shared/namespace/test-runner";
import ResourceRequirements from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/meta/resourcerequirements";

//TODO: Fix duplicate class
export default class CaliperMapper {
    private options: Options;
    private networkConfiguration: ConfigMap;
    private deployment: Deployment;
    private benchmarkConfiguration: ConfigMap;
    private benchmarkCallbacks: ConfigurationDirectoryTreeVolumes<OpaqueSecret>;
    private channels: Channel[];
    private cryptographicMaterialVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[];
    private configurations: ConfigMap[];
    private peerOrganizationUtil: PeerOrganization;
    private writer: ResourceWriter;
    private cryptographicMaterialAbsolutePaths: string[];
    private searchPaths: string[];
    private chainCode: ChainCode;
    private chainCodePassThroughVolume: IVolume;
    private reportsVolume: EmptyDirVolume;
    private resources: any[];
    private workloads: any[];
    private loadBalancerIp: string;
    private parentIpAddress: string;
    private benchmarkPath: string;
    private mountPaths: { workingDirectory: any; network: string; networkConfigurationFile: string; benchmark: string; benchmarkCallbacks: string; benchmarkConfigurationFile: string; cryptographicMaterial: string; channels: string; chaincodes: string; funnelFrom: string; funnelTo: string; goPath: string; reports: string };
    private namespace: string;

    constructor(options: Options) {
        this.options = options;
        this.writer = new ResourceWriter(undefined);
        this.peerOrganizationUtil = new PeerOrganization(this.options);
        this.configurations = [];
        this.resources = [];
        this.workloads = [];
        this.mountPaths = MountPaths(Path.posix.join(Path.posix.sep, "caliper"));
        this.namespace = "test-runner";
    }

    async start(caliperConfiguration: CaliperConfiguration, loadBalancerIp: string, parentIpAddress: string, benchmarkPath: string) {
        this.loadBalancerIp = loadBalancerIp;
        this.benchmarkPath = benchmarkPath;
        this.createNamespace()
        await this.createConfiguration(caliperConfiguration);
        this.createCaliperJob();
        this.createDockerDaemonSet();
        this.parentIpAddress = parentIpAddress;
        this.createBlockEdgeDeployment(caliperConfiguration);
    }

    private async createConfiguration(caliperConfiguration: CaliperConfiguration) {
        this.createNetworkConfiguration(caliperConfiguration);
        await this.createBenchmarkConfiguration();
        this.createCryptographicMaterial();
        this.createChannels();
        this.createChainCodes();
    }

    private createNamespace() {
        this.resources.push({
            path: undefined,
            name: "test-runner-namespace",
            resource: new TestRunnerNamespace()
        });
    }

    private createNetworkConfiguration(caliperConfiguration: CaliperConfiguration) {
        const networkOptions = new NetworkOptions();
        networkOptions.create(caliperConfiguration, this.mountPaths.cryptographicMaterial);
        this.cryptographicMaterialAbsolutePaths = networkOptions.getCryptographicMaterialAbsolutePaths();
        this.searchPaths = networkOptions.getCryptographicMaterialSearchPaths();
        this.networkConfiguration = new ConfigMap('caliper-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", networkOptions.toString());
        this.networkConfiguration.addItem(new KeyToPath("network.json", "network.json"));
        this.configurations.push(this.networkConfiguration);

        this.resources.push({
            path: undefined,
            name: "caliper-network-configuration",
            resource: this.networkConfiguration
        });
    }

    private async createBenchmarkConfiguration(): Promise<any> {
        let benchmarkOptions = Fs.readJsonSync(Path.join(this.benchmarkPath, "configuration.json"));
        benchmarkOptions = await this.setDockerMonitorUrls(benchmarkOptions);
        this.benchmarkConfiguration = new ConfigMap("caliper-benchmark-configuration", this.namespace);
        this.benchmarkConfiguration.addDataPair("benchmark.json", JSON.stringify(benchmarkOptions));
        this.benchmarkConfiguration.addItem(new KeyToPath("benchmark.json", "benchmark.json"));
        this.configurations.push(this.benchmarkConfiguration);
        this.createBenchmarkCallbacks();

        this.resources.push({
            path: undefined,
            name: "caliper-benchmark-configuration",
            resource: this.benchmarkConfiguration
        });
    }

    private async setDockerMonitorUrls(benchmarkOptions: any) {
        benchmarkOptions.monitor.docker.name = [];

        const response = await this.getNodeIpAddressesFromCluster();
        const requestPath = "all";
        const nodes = response.body.items;
        benchmarkOptions.monitor.docker.name = nodes.map((node: any) => {
            const nodeAddresses: any[] = node.status.addresses;
            const address = nodeAddresses.find((address) => {
                return address.type === "InternalIP"
            });
            return `http://${address.address}:2375/${requestPath}`;
        });
        return Promise.resolve(benchmarkOptions);
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

    private createBenchmarkCallbacks(): void {
        const directoryTree = new DirectoryTree(this.callbacksDirectoryPath());
        const configurationDirectoryTree = directoryTree.convertToOpaqueSecretDirectoryTree(this.namespace);
        this.benchmarkCallbacks = new ConfigurationDirectoryTreeVolumes<OpaqueSecret>(configurationDirectoryTree);
    }

    private callbacksDirectoryPath() {
        return Path.join(this.benchmarkPath, 'callbacks');
    }

    private createCryptographicMaterial() {
        this.cryptographicMaterialVolumes = [this.options.get('$.blockchain.organizations.paths.peerorganizations'),
            this.options.get('$.blockchain.organizations.paths.ordererorganizations')
        ].map((path: string) => {
            const directoryTree = new DirectoryTree(path);
            const configurationDirectoryTree = directoryTree.convertToConfigMapDirectoryTree(this.namespace);
            return new ConfigurationDirectoryTreeVolumes<ConfigMap>(configurationDirectoryTree);
        });
    }

    private createChannels() {
        this.channels = this.peerOrganizationUtil.createChannels(this.writer, this.namespace, this.options.get('$.kubernetes.paths.postlaunch'));
    }

    private createCaliperContainers() {
        this.createInitContainers();
        this.createCaliperContainer();
    }

    private createInitContainers() {
        const funnel = new Container("funnel", "kubechain/funnel:1.1.0");
        this.mountChaincodesFromConfiguration(funnel);
        this.mountChainCodePassThroughVolume(funnel, this.mountPaths.funnelTo);
        this.deployment.addInitContainer(funnel);
    }

    private createCaliperContainer() {
        const container = new Container("caliper", "robertdiebels/caliper:0.6.0");
        container.setImagePullPolicy("Always");
        container.addCommand("npm");
        container.addCommand("run");
        container.addCommand("start-server");
        container.addPort(new ContainerPort("http", 3000));
        const requirements = new ResourceRequirements();
        requirements.setLimits({"cpu": 14, "memory": "12Gi"});
        container.setResourceRequirements(requirements);
        this.addEnvironmentVariables(container);
        this.mountConfigurations(container);
        this.mountBenchmarkCallbacks(container);
        this.mountChannels(container);
        this.mountChainCodePassThroughVolume(container, this.mountPaths.chaincodes);
        this.mountCryptographicMaterial(container);
        this.mountReports(container);
        this.deployment.addContainer(container);
        this.deployment.addNodeSelectorMatchLabel("kops.k8s.io/instancegroup", "loadgenerator");
    }

    private addEnvironmentVariables(container: Container) {
        container.addEnvironmentVariable(new EnvVar("GOPATH", this.mountPaths.goPath));
        container.addEnvironmentVariable(new EnvVar("OVERWRITE_GOPATH", "FALSE"));
    }

    private mountConfigurations(container: IContainer) {
        this.mountConfiguration(container, this.networkConfiguration, this.mountPaths.networkConfigurationFile, "network.json");
        this.mountConfiguration(container, this.benchmarkConfiguration, this.mountPaths.benchmarkConfigurationFile, "benchmark.json");
    }

    private mountConfiguration(container: IContainer, configuration: ConfigMap, mountPath: string, subPath: string): void {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }

    private mountBenchmarkCallbacks(container: IContainer) {
        this.benchmarkCallbacks.findAndMount("callbacks", container, this.mountPaths.benchmark);
    }

    private mountChannels(container: IContainer) {
        this.peerOrganizationUtil.mountMountables(this.channels, container, this.mountPaths.channels);
    }

    private mountChaincodesFromConfiguration(container: Container) {
        this.chainCode.mount(container, this.mountPaths.funnelFrom);
    }

    private mountChainCodePassThroughVolume(container: IContainer, path: string) {
        const mount = this.chainCodePassThroughVolume.toVolumeMount(path);
        container.addVolumeMount(mount);
    }

    private mountCryptographicMaterial(container: IContainer) {
        this.cryptographicMaterialVolumes.forEach((volumes) => {
            this.searchPaths.forEach(searchPath => {
                volumes.findAndMount(searchPath, container, this.mountPaths.cryptographicMaterial);
            });
        });
    }

    private createCaliperJob() {
        this.deployment = new Deployment("caliper-deployment", this.namespace);
        this.deployment.addMatchLabel("app", "test-runner");
        this.chainCodePassThroughVolume = new EmptyDirVolume("pass-through");
        this.reportsVolume = new EmptyDirVolume("reports");
        this.setDeploymentAffinity();
        this.createTestRunnerLoadBalanceService();
        this.createCaliperContainers();
        this.addConfigurationAsVolume();
        this.addBenchmarkCallbacksAsVolumes();
        this.addChannelsAsVolumes();
        this.addChainCodesAsVolumes();
        this.addPassThroughVolume();
        this.addReportsVolume();
        this.addCryptographicMaterialAsVolumes();

        this.workloads.push({
            path: undefined,
            name: "caliper-deployment",
            resource: this.deployment
        });
    }

    private setDeploymentAffinity() {
        const affinity = new Affinity();
        const antiAffinity = new PodAntiAffinity();
        const term = new PodAffinityTerm();
        term.addMatchLabel("app", "hyperledger");
        term.setTopologyKey("kubernetes.io/hostname");
        term.addNamespace("org1");
        term.addNamespace("ordererorg");
        antiAffinity.addRequiredPodAffinityTerm(term);
        affinity.setAntiAffinity(antiAffinity);
        this.deployment.setAffinity(new FabricAntiAffinity());
    }

    private createTestRunnerLoadBalanceService() {
        this.resources.push({
            path: undefined,
            name: "caliper-service",
            resource: new TestRunnerLoadBalanceService("test-runner", this.namespace, this.loadBalancerIp)
        });
    }

    private addConfigurationAsVolume() {
        this.configurations.forEach((configuration: ConfigMap) => {
            this.deployment.addVolume(configuration.toVolume());
        })
    }

    private addBenchmarkCallbacksAsVolumes() {
        this.benchmarkCallbacks.findAndAddAsVolumes("callbacks", this.deployment);
    }


    private addChannelsAsVolumes(): void {
        this.peerOrganizationUtil.addMountablesAsVolumes(this.channels, this.deployment);
    }

    private addChainCodesAsVolumes() {
        this.chainCode.addAsVolume(this.deployment)
    }

    private addPassThroughVolume() {
        this.deployment.addVolume(this.chainCodePassThroughVolume);
    }

    private addReportsVolume() {
        this.deployment.addVolume(this.reportsVolume);
    }

    private addCryptographicMaterialAsVolumes() {
        this.cryptographicMaterialVolumes.forEach((volumes) => {
            this.searchPaths.forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            })
        });
    }

    private createDockerDaemonSet() {
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

    private createChainCodes() {
        this.chainCode = this.peerOrganizationUtil.createChainCode({id: "simple-addition-chaincode"}, this.namespace);
        this.chainCode.addToWriter(this.writer, this.options.get('$.kubernetes.paths.postlaunch'));
    }

    private mountReports(container: IContainer) {
        container.addVolumeMount(this.reportsVolume.toVolumeMount(this.mountPaths.reports));
    }

    private createBlockEdgeDeployment(caliperConfiguration: CaliperConfiguration) {
        const deployment = new BlockEdgeDeployment(caliperConfiguration.representation);
        const networkConfiguration = deployment.createNetworkConfiguration();
        deployment.mountNetworkConfiguration();
        deployment.mountCryptographicMaterial(this.cryptographicMaterialVolumes);
        deployment.addCryptographicMaterialAsVolumes(this.cryptographicMaterialVolumes);
        deployment.addNetworkConfigurationAsVolume();
        deployment.addParentIpAddress(this.parentIpAddress);

        this.resources.push({
            path: undefined,
            name: "block-edge-network-configuration",
            resource: networkConfiguration
        });

        this.resources.push({
            path: undefined,
            name: "block-edge-deployment",
            resource: deployment
        });
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
        this.benchmarkCallbacks.findAndAddToWriter(this.callbacksDirectoryPath(), this.writer, outputPath);
        this.cryptographicMaterialVolumes.forEach((volumes) => {
            this.cryptographicMaterialAbsolutePaths.forEach(searchPath => {
                volumes.findAndAddToWriter(searchPath, this.writer, outputPath);
            })
        });
    }
}