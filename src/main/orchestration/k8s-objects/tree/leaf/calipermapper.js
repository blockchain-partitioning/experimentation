"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const Fs = require("fs-extra");
const configmap_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap");
const container_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container");
const directorytree_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/kubernetes/directorytree/directorytree");
const organization_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization");
const configurationdirectorytreevolumes_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes");
const resourcewriter_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/resourcewriter/resourcewriter");
const envvar_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar");
const keytopath_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath");
const emptydir_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/emptydir");
const crud_resource_1 = require("kubechain/src/main/lib/kubernetes-sdk/utilities/resources/crud/crud-resource");
const node_1 = require("kubechain/src/main/lib/kubernetes-sdk/utilities/kinds/cluster/node");
const KubernetesClient = require("kubernetes-client");
const deployment_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment");
const port_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port");
const affinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity");
const antiaffinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity");
const term_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term");
const testrunnerloadbalanceservice_1 = require("../../shared/test-runner/testrunnerloadbalanceservice");
const mountpaths_1 = require("../../shared/test-runner/mountpaths");
const networkoptions_1 = require("../../shared/test-runner/networkoptions");
const docker_service_1 = require("../../shared/docker-access/docker-service");
const docker_daemonset_1 = require("../../shared/docker-access/docker-daemonset");
const deployment_2 = require("./block-edge/deployment");
const antiaffinityexpressions_1 = require("../../shared/affinity/antiaffinityexpressions");
const test_runner_1 = require("../../shared/namespace/test-runner");
const resourcerequirements_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/meta/resourcerequirements");
//TODO: Fix duplicate class
class CaliperMapper {
    constructor(options) {
        this.options = options;
        this.writer = new resourcewriter_1.default(undefined);
        this.peerOrganizationUtil = new organization_1.default(this.options);
        this.configurations = [];
        this.resources = [];
        this.workloads = [];
        this.mountPaths = mountpaths_1.default(Path.posix.join(Path.posix.sep, "caliper"));
        this.namespace = "test-runner";
    }
    start(caliperConfiguration, loadBalancerIp, parentIpAddress, benchmarkPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.loadBalancerIp = loadBalancerIp;
            this.benchmarkPath = benchmarkPath;
            this.createNamespace();
            yield this.createConfiguration(caliperConfiguration);
            this.createCaliperJob();
            this.createDockerDaemonSet();
            this.parentIpAddress = parentIpAddress;
            this.createBlockEdgeDeployment(caliperConfiguration);
        });
    }
    createConfiguration(caliperConfiguration) {
        return __awaiter(this, void 0, void 0, function* () {
            this.createNetworkConfiguration(caliperConfiguration);
            yield this.createBenchmarkConfiguration();
            this.createCryptographicMaterial();
            this.createChannels();
            this.createChainCodes();
        });
    }
    createNamespace() {
        this.resources.push({
            path: undefined,
            name: "test-runner-namespace",
            resource: new test_runner_1.default()
        });
    }
    createNetworkConfiguration(caliperConfiguration) {
        const networkOptions = new networkoptions_1.default();
        networkOptions.create(caliperConfiguration, this.mountPaths.cryptographicMaterial);
        this.cryptographicMaterialAbsolutePaths = networkOptions.getCryptographicMaterialAbsolutePaths();
        this.searchPaths = networkOptions.getCryptographicMaterialSearchPaths();
        this.networkConfiguration = new configmap_1.default('caliper-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", networkOptions.toString());
        this.networkConfiguration.addItem(new keytopath_1.default("network.json", "network.json"));
        this.configurations.push(this.networkConfiguration);
        this.resources.push({
            path: undefined,
            name: "caliper-network-configuration",
            resource: this.networkConfiguration
        });
    }
    createBenchmarkConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            let benchmarkOptions = Fs.readJsonSync(Path.join(this.benchmarkPath, "configuration.json"));
            benchmarkOptions = yield this.setDockerMonitorUrls(benchmarkOptions);
            this.benchmarkConfiguration = new configmap_1.default("caliper-benchmark-configuration", this.namespace);
            this.benchmarkConfiguration.addDataPair("benchmark.json", JSON.stringify(benchmarkOptions));
            this.benchmarkConfiguration.addItem(new keytopath_1.default("benchmark.json", "benchmark.json"));
            this.configurations.push(this.benchmarkConfiguration);
            this.createBenchmarkCallbacks();
            this.resources.push({
                path: undefined,
                name: "caliper-benchmark-configuration",
                resource: this.benchmarkConfiguration
            });
        });
    }
    setDockerMonitorUrls(benchmarkOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            benchmarkOptions.monitor.docker.name = [];
            const response = yield this.getNodeIpAddressesFromCluster();
            const requestPath = "all";
            const nodes = response.body.items;
            benchmarkOptions.monitor.docker.name = nodes.map((node) => {
                const nodeAddresses = node.status.addresses;
                const address = nodeAddresses.find((address) => {
                    return address.type === "InternalIP";
                });
                return `http://${address.address}:2375/${requestPath}`;
            });
            return Promise.resolve(benchmarkOptions);
        });
    }
    getNodeIpAddressesFromCluster() {
        return __awaiter(this, void 0, void 0, function* () {
            const config = KubernetesClient.config;
            const client = new KubernetesClient.Client({
                config: config.fromKubeconfig(undefined, this.options.get('$.kubernetes.context')),
                version: '1.8'
            });
            const resource = new crud_resource_1.default({ apiVersion: "v1", metadata: {} }, new node_1.default());
            return resource.getAll(client, { qs: { labelSelector: "node-role.kubernetes.io/node" } });
        });
    }
    createBenchmarkCallbacks() {
        const directoryTree = new directorytree_1.default(this.callbacksDirectoryPath());
        const configurationDirectoryTree = directoryTree.convertToOpaqueSecretDirectoryTree(this.namespace);
        this.benchmarkCallbacks = new configurationdirectorytreevolumes_1.default(configurationDirectoryTree);
    }
    callbacksDirectoryPath() {
        return Path.join(this.benchmarkPath, 'callbacks');
    }
    createCryptographicMaterial() {
        this.cryptographicMaterialVolumes = [this.options.get('$.blockchain.organizations.paths.peerorganizations'),
            this.options.get('$.blockchain.organizations.paths.ordererorganizations')
        ].map((path) => {
            const directoryTree = new directorytree_1.default(path);
            const configurationDirectoryTree = directoryTree.convertToConfigMapDirectoryTree(this.namespace);
            return new configurationdirectorytreevolumes_1.default(configurationDirectoryTree);
        });
    }
    createChannels() {
        this.channels = this.peerOrganizationUtil.createChannels(this.writer, this.namespace, this.options.get('$.kubernetes.paths.postlaunch'));
    }
    createCaliperContainers() {
        this.createInitContainers();
        this.createCaliperContainer();
    }
    createInitContainers() {
        const funnel = new container_1.default("funnel", "kubechain/funnel:1.1.0");
        this.mountChaincodesFromConfiguration(funnel);
        this.mountChainCodePassThroughVolume(funnel, this.mountPaths.funnelTo);
        this.deployment.addInitContainer(funnel);
    }
    createCaliperContainer() {
        const container = new container_1.default("caliper", "robertdiebels/caliper:0.6.0");
        container.setImagePullPolicy("Always");
        container.addCommand("npm");
        container.addCommand("run");
        container.addCommand("start-server");
        container.addPort(new port_1.default("http", 3000));
        const requirements = new resourcerequirements_1.default();
        requirements.setLimits({ "cpu": 14, "memory": "12Gi" });
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
    addEnvironmentVariables(container) {
        container.addEnvironmentVariable(new envvar_1.default("GOPATH", this.mountPaths.goPath));
        container.addEnvironmentVariable(new envvar_1.default("OVERWRITE_GOPATH", "FALSE"));
    }
    mountConfigurations(container) {
        this.mountConfiguration(container, this.networkConfiguration, this.mountPaths.networkConfigurationFile, "network.json");
        this.mountConfiguration(container, this.benchmarkConfiguration, this.mountPaths.benchmarkConfigurationFile, "benchmark.json");
    }
    mountConfiguration(container, configuration, mountPath, subPath) {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }
    mountBenchmarkCallbacks(container) {
        this.benchmarkCallbacks.findAndMount("callbacks", container, this.mountPaths.benchmark);
    }
    mountChannels(container) {
        this.peerOrganizationUtil.mountMountables(this.channels, container, this.mountPaths.channels);
    }
    mountChaincodesFromConfiguration(container) {
        this.chainCode.mount(container, this.mountPaths.funnelFrom);
    }
    mountChainCodePassThroughVolume(container, path) {
        const mount = this.chainCodePassThroughVolume.toVolumeMount(path);
        container.addVolumeMount(mount);
    }
    mountCryptographicMaterial(container) {
        this.cryptographicMaterialVolumes.forEach((volumes) => {
            this.searchPaths.forEach(searchPath => {
                volumes.findAndMount(searchPath, container, this.mountPaths.cryptographicMaterial);
            });
        });
    }
    createCaliperJob() {
        this.deployment = new deployment_1.default("caliper-deployment", this.namespace);
        this.deployment.addMatchLabel("app", "test-runner");
        this.chainCodePassThroughVolume = new emptydir_1.default("pass-through");
        this.reportsVolume = new emptydir_1.default("reports");
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
    setDeploymentAffinity() {
        const affinity = new affinity_1.default();
        const antiAffinity = new antiaffinity_1.default();
        const term = new term_1.default();
        term.addMatchLabel("app", "hyperledger");
        term.setTopologyKey("kubernetes.io/hostname");
        term.addNamespace("org1");
        term.addNamespace("ordererorg");
        antiAffinity.addRequiredPodAffinityTerm(term);
        affinity.setAntiAffinity(antiAffinity);
        this.deployment.setAffinity(new antiaffinityexpressions_1.default());
    }
    createTestRunnerLoadBalanceService() {
        this.resources.push({
            path: undefined,
            name: "caliper-service",
            resource: new testrunnerloadbalanceservice_1.default("test-runner", this.namespace, this.loadBalancerIp)
        });
    }
    addConfigurationAsVolume() {
        this.configurations.forEach((configuration) => {
            this.deployment.addVolume(configuration.toVolume());
        });
    }
    addBenchmarkCallbacksAsVolumes() {
        this.benchmarkCallbacks.findAndAddAsVolumes("callbacks", this.deployment);
    }
    addChannelsAsVolumes() {
        this.peerOrganizationUtil.addMountablesAsVolumes(this.channels, this.deployment);
    }
    addChainCodesAsVolumes() {
        this.chainCode.addAsVolume(this.deployment);
    }
    addPassThroughVolume() {
        this.deployment.addVolume(this.chainCodePassThroughVolume);
    }
    addReportsVolume() {
        this.deployment.addVolume(this.reportsVolume);
    }
    addCryptographicMaterialAsVolumes() {
        this.cryptographicMaterialVolumes.forEach((volumes) => {
            this.searchPaths.forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            });
        });
    }
    createDockerDaemonSet() {
        this.workloads.push({
            path: undefined,
            name: "docker-http-daemonset",
            resource: new docker_daemonset_1.default()
        });
        this.resources.push({
            path: undefined,
            name: "docker-http-service",
            resource: new docker_service_1.default()
        });
    }
    createChainCodes() {
        this.chainCode = this.peerOrganizationUtil.createChainCode({ id: "simple-addition-chaincode" }, this.namespace);
        this.chainCode.addToWriter(this.writer, this.options.get('$.kubernetes.paths.postlaunch'));
    }
    mountReports(container) {
        container.addVolumeMount(this.reportsVolume.toVolumeMount(this.mountPaths.reports));
    }
    createBlockEdgeDeployment(caliperConfiguration) {
        const deployment = new deployment_2.default(caliperConfiguration.representation);
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
    addResources(outputPath) {
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
            });
        });
    }
}
exports.default = CaliperMapper;
//# sourceMappingURL=calipermapper.js.map