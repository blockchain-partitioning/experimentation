import * as Path from "path";
import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import Deployment from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/deployment/deployment";
import ConfigMap from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/configuration/configmap/configmap";
import Container from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container.js";
import IContainer from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/icontainer";
import ContainerPort from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port";
import ConfigurationDirectoryTreeVolumes from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/volumes/configurationdirectorytreevolumes";
import EnvVar from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar";
import ChainCode from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/chaincode/chaincode";
import Channel from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/channel/channel";
import PeerOrganization from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/organizations/peer/organization";
import Options from "kubechain/src/main/lib/blockchains/fabric/options";
import EmptyDirVolume from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/emptydir";
import PodAntiAffinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity";
import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";
import PodAffinityTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term";
import MountPaths from "../../shared/test-runner/mountpaths";
import FabricAntiAffinity from "../../shared/affinity/antiaffinityexpressions";
import ResourceRequirements from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/meta/resourcerequirements";

export default class TestRunnerDeployment implements IResource {
    private deployment: Deployment;
    private testRunnerContainer: Container;
    private crytpoMountPath: string;
    private networkMountPath: string;
    private peerOrganizationUtil: PeerOrganization;
    private funnelContainer: Container;
    private chainCodeFunnelVolume: EmptyDirVolume;
    private mountPaths: { workingDirectory: any; network: string; networkConfigurationFile: string; benchmark: string; benchmarkCallbacks: string; benchmarkConfigurationFile: string; cryptographicMaterial: string; channels: string; chaincodes: string; funnelFrom: string; funnelTo: string; goPath: string; reports: string };

    constructor(options: Options) {
        this.deployment = new Deployment("test-runner", "test-runner");
        this.deployment.addMatchLabel("app", "test-runner");
        this.networkMountPath = Path.posix.join(Path.posix.sep, "test-runner", "network");
        this.crytpoMountPath = Path.posix.join(Path.posix.sep, "test-runner", "network", "crypto");
        this.peerOrganizationUtil = new PeerOrganization(options);
        this.chainCodeFunnelVolume = new EmptyDirVolume("pass-through");
        this.mountPaths = MountPaths(Path.posix.join(Path.posix.sep, "test-runner"));
        this.setAffinity();
        this.createInitContainer();
        this.createContainer();
        this.addFunnelVolume();
    }

    private setAffinity() {
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

    private createInitContainer() {
        this.funnelContainer = new Container("funnel", "kubechain/funnel:1.1.0");
        this.mountChainCodeFunnelVolume(this.funnelContainer, this.mountPaths.funnelTo);
        this.deployment.addInitContainer(this.funnelContainer);
    }

    private mountChainCodeFunnelVolume(container: IContainer, path: string) {
        const mount = this.chainCodeFunnelVolume.toVolumeMount(path);
        container.addVolumeMount(mount);
    }

    private createContainer() {
        this.testRunnerContainer = new Container("test-runner", "robertdiebels/fabric-root-test-runner:0.3.0");
        this.testRunnerContainer.addPort(new ContainerPort("http-server", 3000));
        this.testRunnerContainer.setImagePullPolicy("Always");
        const requirements = new ResourceRequirements();
        requirements.setLimits({"cpu": 14, "memory": "12Gi"});
        this.testRunnerContainer.setResourceRequirements(requirements);
        this.addEnvironmentVariables(this.testRunnerContainer);
        this.deployment.addContainer(this.testRunnerContainer);
        this.mountChainCodeFunnelVolume(this.testRunnerContainer, this.mountPaths.chaincodes);
    }


    private addEnvironmentVariables(container: Container) {
        container.addEnvironmentVariable(new EnvVar("GOPATH", this.mountPaths.goPath));
        container.addEnvironmentVariable(new EnvVar("OVERWRITE_GOPATH", "FALSE"));
    }

    addEnvironmentVariable(envVar: EnvVar) {
        this.testRunnerContainer.addEnvironmentVariable(envVar);
    }

    mountCryptographicMaterial(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[], searchPaths: string[]) {
        directoryTreeVolumes.forEach((volumes) => {
            searchPaths.forEach(searchPath => {
                volumes.findAndMount(searchPath, this.testRunnerContainer, this.crytpoMountPath);
            });
        });
    }

    addCryptographicMaterialAsVolumes(directoryTreeVolumes: ConfigurationDirectoryTreeVolumes<ConfigMap>[], searchPaths: string[]) {
        directoryTreeVolumes.forEach((volumes) => {
            searchPaths.forEach(searchPath => {
                volumes.findAndAddAsVolumes(searchPath, this.deployment);
            })
        });
    }

    mountNetworkConfiguration(networkConfiguration: ConfigMap) {
        this.mountConfiguration(this.testRunnerContainer, networkConfiguration, this.mountPaths.networkConfigurationFile, "network.json");
    }

    mountBenchMarkConfiguration(benchmarkConfiguration: ConfigMap) {
        this.mountConfiguration(this.testRunnerContainer, benchmarkConfiguration, this.mountPaths.benchmarkConfigurationFile, "benchmark.json");
    }

    addConfigurationAsVolume(configuration: ConfigMap) {
        this.deployment.addVolume(configuration.toVolume());
    }

    private mountConfiguration(container: IContainer, configuration: ConfigMap, mountPath: string, subPath: string): void {
        const volumeMount = configuration.toVolume().toVolumeMount(mountPath);
        volumeMount.setSubPath(subPath);
        container.addVolumeMount(volumeMount);
    }

    toJson(): any {
        return this.deployment.toJson();
    }

    mountChaincodes(chainCodes: ChainCode[]) {
        this.peerOrganizationUtil.mountMountables(chainCodes, this.funnelContainer, this.mountPaths.funnelFrom);
    }

    addChainCodesAsVolumes(chainCodes: ChainCode[]): void {
        this.peerOrganizationUtil.addMountablesAsVolumes(chainCodes, this.deployment);
    }

    mountChannels(channels: Channel[]) {
        this.peerOrganizationUtil.mountMountables(channels, this.testRunnerContainer, this.mountPaths.channels);
    }

    addChannelsAsVolumes(channels: Channel[]): void {
        this.peerOrganizationUtil.addMountablesAsVolumes(channels, this.deployment);
    }

    private addFunnelVolume() {
        this.deployment.addVolume(this.chainCodeFunnelVolume);
    }
}