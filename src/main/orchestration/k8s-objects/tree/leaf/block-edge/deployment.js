"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const deployment_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment");
const configmap_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap");
const container_js_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container.js");
const keytopath_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath");
const port_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port");
const envvar_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar");
const fabric_network_1 = require("../../../shared/network/fabric-network");
class BlockEdgeDeployment {
    constructor(representation) {
        this.namespace = "test-runner";
        this.deployment = new deployment_1.default("block-edge", this.namespace);
        this.deployment.addMatchLabel("app", "block-edge");
        this.networkMountPath = Path.posix.join(Path.posix.sep, "block-edge", "network");
        this.crytpoMountPath = Path.posix.join(Path.posix.sep, "block-edge", "network", "crypto");
        this.network = new fabric_network_1.default(representation, this.crytpoMountPath);
        this.createContainer();
    }
    createContainer() {
        this.container = new container_js_1.default("block-edge", "robertdiebels/fabric-leaf-block-edge:0.1.0");
        this.container.addPort(new port_1.default("http-server", 3000));
        this.container.setImagePullPolicy("Always");
        this.deployment.addContainer(this.container);
    }
    mountCryptographicMaterial(directoryTreeVolumes) {
        directoryTreeVolumes.forEach((volumes) => {
            this.network.getCryptographicMaterialSearchPaths().forEach(searchPath => {
                volumes.findAndMount(searchPath, this.container, this.crytpoMountPath);
            });
        });
    }
    addCryptographicMaterialAsVolumes(directoryTreeVolumes) {
        directoryTreeVolumes.forEach((volumes) => {
            this.network.getCryptographicMaterialSearchPaths().forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            });
        });
    }
    createNetworkConfiguration() {
        this.networkConfiguration = new configmap_1.default('block-edge-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", JSON.stringify(this.network.toJson()));
        this.networkConfiguration.addItem(new keytopath_1.default("network.json", "network.json"));
        return this.networkConfiguration;
    }
    mountNetworkConfiguration() {
        this.mountConfiguration(this.container, this.networkConfiguration, Path.posix.join(this.networkMountPath, "configuration.json"), "network.json");
    }
    addNetworkConfigurationAsVolume() {
        this.deployment.addVolume(this.networkConfiguration.toVolume());
    }
    mountConfiguration(container, configuration, mountPath, subPath) {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }
    addParentIpAddress(ipAddress) {
        this.container.addEnvironmentVariable(new envvar_1.default("PARENT", ipAddress));
    }
    toJson() {
        return this.deployment.toJson();
    }
}
exports.default = BlockEdgeDeployment;
//# sourceMappingURL=deployment.js.map