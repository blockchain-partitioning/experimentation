"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const deployment_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment");
const container_js_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container.js");
const port_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port");
const envvar_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar");
const organization_1 = require("kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization");
const emptydir_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/emptydir");
const antiaffinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity");
const affinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity");
const term_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term");
const mountpaths_1 = require("../../shared/test-runner/mountpaths");
const antiaffinityexpressions_1 = require("../../shared/affinity/antiaffinityexpressions");
const resourcerequirements_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/meta/resourcerequirements");
class TestRunnerDeployment {
    constructor(options) {
        this.deployment = new deployment_1.default("test-runner", "test-runner");
        this.deployment.addMatchLabel("app", "test-runner");
        this.networkMountPath = Path.posix.join(Path.posix.sep, "test-runner", "network");
        this.crytpoMountPath = Path.posix.join(Path.posix.sep, "test-runner", "network", "crypto");
        this.peerOrganizationUtil = new organization_1.default(options);
        this.chainCodeFunnelVolume = new emptydir_1.default("pass-through");
        this.mountPaths = mountpaths_1.default(Path.posix.join(Path.posix.sep, "test-runner"));
        this.setAffinity();
        this.createInitContainer();
        this.createContainer();
        this.addFunnelVolume();
    }
    setAffinity() {
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
    createInitContainer() {
        this.funnelContainer = new container_js_1.default("funnel", "kubechain/funnel:1.1.0");
        this.mountChainCodeFunnelVolume(this.funnelContainer, this.mountPaths.funnelTo);
        this.deployment.addInitContainer(this.funnelContainer);
    }
    mountChainCodeFunnelVolume(container, path) {
        const mount = this.chainCodeFunnelVolume.toVolumeMount(path);
        container.addVolumeMount(mount);
    }
    createContainer() {
        this.testRunnerContainer = new container_js_1.default("test-runner", "robertdiebels/fabric-root-test-runner:0.3.0");
        this.testRunnerContainer.addPort(new port_1.default("http-server", 3000));
        this.testRunnerContainer.setImagePullPolicy("Always");
        const requirements = new resourcerequirements_1.default();
        requirements.setLimits({ "cpu": 14, "memory": "12Gi" });
        this.testRunnerContainer.setResourceRequirements(requirements);
        this.addEnvironmentVariables(this.testRunnerContainer);
        this.deployment.addContainer(this.testRunnerContainer);
        this.mountChainCodeFunnelVolume(this.testRunnerContainer, this.mountPaths.chaincodes);
    }
    addEnvironmentVariables(container) {
        container.addEnvironmentVariable(new envvar_1.default("GOPATH", this.mountPaths.goPath));
        container.addEnvironmentVariable(new envvar_1.default("OVERWRITE_GOPATH", "FALSE"));
    }
    addEnvironmentVariable(envVar) {
        this.testRunnerContainer.addEnvironmentVariable(envVar);
    }
    mountCryptographicMaterial(directoryTreeVolumes, searchPaths) {
        directoryTreeVolumes.forEach((volumes) => {
            searchPaths.forEach(searchPath => {
                volumes.findAndMount(searchPath, this.testRunnerContainer, this.crytpoMountPath);
            });
        });
    }
    addCryptographicMaterialAsVolumes(directoryTreeVolumes, searchPaths) {
        directoryTreeVolumes.forEach((volumes) => {
            searchPaths.forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            });
        });
    }
    mountNetworkConfiguration(networkConfiguration) {
        this.mountConfiguration(this.testRunnerContainer, networkConfiguration, this.mountPaths.networkConfigurationFile, "network.json");
    }
    mountBenchMarkConfiguration(benchmarkConfiguration) {
        this.mountConfiguration(this.testRunnerContainer, benchmarkConfiguration, this.mountPaths.benchmarkConfigurationFile, "benchmark.json");
    }
    addConfigurationAsVolume(configuration) {
        this.deployment.addVolume(configuration.toVolume());
    }
    mountConfiguration(container, configuration, mountPath, subPath) {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }
    toJson() {
        return this.deployment.toJson();
    }
    mountChaincodes(chainCodes) {
        this.peerOrganizationUtil.mountMountables(chainCodes, this.funnelContainer, this.mountPaths.funnelFrom);
    }
    addChainCodesAsVolumes(chainCodes) {
        this.peerOrganizationUtil.addMountablesAsVolumes(chainCodes, this.deployment);
    }
    mountChannels(channels) {
        this.peerOrganizationUtil.mountMountables(channels, this.testRunnerContainer, this.mountPaths.channels);
    }
    addChannelsAsVolumes(channels) {
        this.peerOrganizationUtil.addMountablesAsVolumes(channels, this.deployment);
    }
    addFunnelVolume() {
        this.deployment.addVolume(this.chainCodeFunnelVolume);
    }
}
exports.default = TestRunnerDeployment;
//# sourceMappingURL=deployment.js.map