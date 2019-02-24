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
const keytopath_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath");
const configmap_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap");
const configurationdirectorytreevolumes_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes");
const directorytree_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/kubernetes/directorytree/directorytree");
const organization_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization");
const resourcewriter_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/resourcewriter/resourcewriter");
const node_1 = require("kubechain/src/main/lib/kubernetes-sdk/utilities/kinds/cluster/node");
const crud_resource_1 = require("kubechain/src/main/lib/kubernetes-sdk/utilities/resources/crud/crud-resource");
const KubernetesClient = require("kubernetes-client");
const envvar_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar");
const deployment_1 = require("./deployment");
const docker_service_1 = require("../../shared/docker-access/docker-service");
const networkoptions_1 = require("../../shared/test-runner/networkoptions");
const docker_daemonset_1 = require("../../shared/docker-access/docker-daemonset");
const testrunnerloadbalanceservice_1 = require("../../shared/test-runner/testrunnerloadbalanceservice");
const mountpaths_1 = require("../../shared/test-runner/mountpaths");
const test_runner_1 = require("../../shared/namespace/test-runner");
class ResourceCreator {
    constructor(options) {
        this.options = options;
        this.workloads = [];
        this.resources = [];
        this.peerOrganizationUtil = new organization_1.default(this.options);
        this.writer = new resourcewriter_1.default(undefined);
        this.mountPaths = mountpaths_1.default(Path.posix.join(Path.posix.sep, "test-runner"));
        this.namespace = "test-runner";
    }
    start(configuration, testRunnerConfiguration, benchmarkPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.testRunnerConfiguration = testRunnerConfiguration;
            this.benchmarkPath = benchmarkPath;
            this.createDockerApiAccessResources();
            yield this.createTestRunnerResources(configuration);
        });
    }
    createDockerApiAccessResources() {
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
    createTestRunnerResources(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            this.createNamespace();
            this.createTestRunnerConfigurationResources(configuration);
            yield this.createTestInitiatorDeployment();
            this.createTestRunnerService();
        });
    }
    createNamespace() {
        this.resources.push({
            path: undefined,
            name: "test-runner-namespace",
            resource: new test_runner_1.default()
        });
    }
    createTestRunnerConfigurationResources(configuration) {
        this.createNetworkConfigurationResource(configuration);
        this.createBenchmarkConfiguration();
        this.createCryptographicMaterialResources();
        this.createChannelResources();
        this.createChainCodeResources();
        this.createTestRunnerService();
    }
    createNetworkConfigurationResource(configuration) {
        const networkOptions = new networkoptions_1.default();
        networkOptions.create(configuration, this.mountPaths.cryptographicMaterial);
        this.cryptographicMaterialAbsolutePaths = networkOptions.getCryptographicMaterialAbsolutePaths();
        this.searchPaths = networkOptions.getCryptographicMaterialSearchPaths();
        this.networkConfiguration = new configmap_1.default('test-runner-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", networkOptions.toString());
        this.networkConfiguration.addItem(new keytopath_1.default("network.json", "network.json"));
        this.resources.push({
            path: undefined,
            name: "test-runner-network-configuration",
            resource: this.networkConfiguration
        });
    }
    createBenchmarkConfiguration() {
        this.benchmarkConfiguration = new configmap_1.default('test-runner-benchmark-configuration', this.namespace);
        this.benchmarkConfiguration.addDataPair("benchmark.json", JSON.stringify(Fs.readJsonSync(Path.resolve(__dirname, Path.join(this.benchmarkPath, "configuration.json")))));
        this.benchmarkConfiguration.addItem(new keytopath_1.default("benchmark.json", "benchmark.json"));
        this.resources.push({
            path: undefined,
            name: "test-runner-benchmark-configuration",
            resource: this.benchmarkConfiguration
        });
    }
    createCryptographicMaterialResources() {
        this.cryptographicMaterialResources = [this.options.get('$.blockchain.organizations.paths.peerorganizations'),
            this.options.get('$.blockchain.organizations.paths.ordererorganizations')
        ].map((path) => {
            const directoryTree = new directorytree_1.default(path);
            const configurationDirectoryTree = directoryTree.convertToConfigMapDirectoryTree(this.namespace);
            return new configurationdirectorytreevolumes_1.default(configurationDirectoryTree);
        });
    }
    createChannelResources() {
        this.chainCode = this.peerOrganizationUtil.createChainCode({ id: "simple-addition-chaincode" }, this.namespace);
        this.chainCode.addToWriter(this.writer, this.options.get('$.kubernetes.paths.postlaunch'));
    }
    createChainCodeResources() {
        this.channels = this.peerOrganizationUtil.createChannels(this.writer, this.namespace, this.options.get('$.kubernetes.paths.postlaunch'));
    }
    createTestInitiatorDeployment() {
        return __awaiter(this, void 0, void 0, function* () {
            const deployment = new deployment_1.default(this.options);
            this.workloads.push({
                path: undefined,
                name: "test-runner-deployment",
                resource: deployment
            });
            yield this.addDockerMonitorUrlsToTestInitiator(deployment);
            this.mountTestInitiatorConfiguration(deployment);
            this.addTestInitiatorConfigurationVolumes(deployment);
        });
    }
    addDockerMonitorUrlsToTestInitiator(deployment) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeUrls = yield this.getDockerMonitorUrls();
            deployment.addEnvironmentVariable(new envvar_1.default("NODES_TO_WATCH", JSON.stringify(nodeUrls)));
            deployment.addEnvironmentVariable(new envvar_1.default("CHILDREN", JSON.stringify(this.testRunnerConfiguration.childrenIPAddresses)));
            deployment.addEnvironmentVariable(new envvar_1.default("TRANSACTIONS_PER_SECOND", JSON.stringify(this.testRunnerConfiguration.transactionsPerSecond)));
        });
    }
    getDockerMonitorUrls() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.getNodeIpAddressesFromCluster();
            const requestPath = "all";
            const nodes = response.body.items;
            return nodes.map((node) => {
                const nodeAddresses = node.status.addresses;
                const address = nodeAddresses.find((address) => {
                    return address.type === "InternalIP";
                });
                return `http://${address.address}:2375/${requestPath}`;
            });
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
    mountTestInitiatorConfiguration(deployment) {
        deployment.mountNetworkConfiguration(this.networkConfiguration);
        deployment.mountBenchMarkConfiguration(this.benchmarkConfiguration);
        deployment.mountCryptographicMaterial(this.cryptographicMaterialResources, this.searchPaths);
        deployment.mountChannels(this.channels);
        deployment.mountChaincodes([this.chainCode]);
    }
    addTestInitiatorConfigurationVolumes(deployment) {
        deployment.addConfigurationAsVolume(this.networkConfiguration);
        deployment.addConfigurationAsVolume(this.benchmarkConfiguration);
        deployment.addCryptographicMaterialAsVolumes(this.cryptographicMaterialResources, this.searchPaths);
        deployment.addChannelsAsVolumes(this.channels);
        deployment.addChainCodesAsVolumes([this.chainCode]);
    }
    createTestRunnerService() {
        const service = new testrunnerloadbalanceservice_1.default("test-runner-loadbancer", this.namespace, this.testRunnerConfiguration.loadBalancerIP);
        this.resources.push({
            name: "test-runner-loadbancer",
            path: undefined,
            resource: service
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
        this.cryptographicMaterialResources.forEach((volumes) => {
            this.cryptographicMaterialAbsolutePaths.forEach(searchPath => {
                volumes.findAndAddToWriter(searchPath, this.writer, outputPath);
            });
        });
    }
}
exports.default = ResourceCreator;
//# sourceMappingURL=resourcecreator.js.map