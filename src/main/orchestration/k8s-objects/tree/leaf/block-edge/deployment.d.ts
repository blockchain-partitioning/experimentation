import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import ConfigMap from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap";
import OrganizationRepresentation from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/representation/organizations/representation";
import ConfigurationDirectoryTreeVolumes from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes";
export default class BlockEdgeDeployment implements IResource {
    private deployment;
    private container;
    private network;
    private networkConfiguration;
    private crytpoMountPath;
    private networkMountPath;
    private namespace;
    constructor(representation: {
        peers: OrganizationRepresentation[];
        orderers: OrganizationRepresentation[];
    });
    private createContainer;
    mountCryptographicMaterial(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[]): void;
    addCryptographicMaterialAsVolumes(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[]): void;
    createNetworkConfiguration(): ConfigMap;
    mountNetworkConfiguration(): void;
    addNetworkConfigurationAsVolume(): void;
    private mountConfiguration;
    addParentIpAddress(ipAddress: string): void;
    toJson(): any;
}
