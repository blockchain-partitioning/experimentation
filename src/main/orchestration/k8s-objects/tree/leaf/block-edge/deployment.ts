import * as Path from "path";
import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import Deployment from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment"
import ConfigMap from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap"
import Container from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container.js"
import OrganizationRepresentation from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/representation/organizations/representation";
import KeyToPath from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/volumesources/keytopath";
import IContainer from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/icontainer";
import ContainerPort from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port";
import ConfigurationDirectoryTreeVolumes from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes";
import EnvVar from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar";
import FabricNetwork from "../../../shared/network/fabric-network";

export default class BlockEdgeDeployment implements IResource {
    private deployment: Deployment;
    private container: Container;
    private network: FabricNetwork;
    private networkConfiguration: ConfigMap;
    private crytpoMountPath: string;
    private networkMountPath: string;
    private namespace: string;

    constructor(representation: { peers: OrganizationRepresentation[], orderers: OrganizationRepresentation[] }) {
        this.namespace = "test-runner";
        this.deployment = new Deployment("block-edge", this.namespace);
        this.deployment.addMatchLabel("app", "block-edge");
        this.networkMountPath = Path.posix.join(Path.posix.sep, "block-edge", "network");
        this.crytpoMountPath = Path.posix.join(Path.posix.sep, "block-edge", "network", "crypto");
        this.network = new FabricNetwork(representation, this.crytpoMountPath);
        this.createContainer();
    }

    private createContainer() {
        this.container = new Container("block-edge", "robertdiebels/fabric-leaf-block-edge:0.1.0");
        this.container.addPort(new ContainerPort("http-server", 3000));
        this.container.setImagePullPolicy("Always");
        this.deployment.addContainer(this.container);
    }

    mountCryptographicMaterial(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[]) {
        directoryTreeVolumes.forEach((volumes) => {
            this.network.getCryptographicMaterialSearchPaths().forEach(searchPath => {
                volumes.findAndMount(searchPath, this.container, this.crytpoMountPath);
            });
        });
    }

    addCryptographicMaterialAsVolumes(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[]) {
        directoryTreeVolumes.forEach((volumes) => {
            this.network.getCryptographicMaterialSearchPaths().forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            })
        });
    }

    createNetworkConfiguration() {
        this.networkConfiguration = new ConfigMap('block-edge-network-configuration', this.namespace);
        this.networkConfiguration.addDataPair("network.json", JSON.stringify(this.network.toJson()));
        this.networkConfiguration.addItem(new KeyToPath("network.json", "network.json"));

        return this.networkConfiguration;
    }

    mountNetworkConfiguration() {
        this.mountConfiguration(this.container, this.networkConfiguration, Path.posix.join(this.networkMountPath, "configuration.json"), "network.json");
    }

    addNetworkConfigurationAsVolume() {
        this.deployment.addVolume(this.networkConfiguration.toVolume());
    }

    private mountConfiguration(container: IContainer, configuration: ConfigMap, mountPath: string, subPath: string): void {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }

    addParentIpAddress(ipAddress: string) {
        this.container.addEnvironmentVariable(new EnvVar("PARENT", ipAddress));
    }

    toJson(): any {
        return this.deployment.toJson();
    }
}