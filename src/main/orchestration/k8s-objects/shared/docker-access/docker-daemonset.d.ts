import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
export default class DockerDaemonset implements IResource {
    private daemonSet;
    private runHostPathVolume;
    private dockerContainer;
    constructor();
    private createVolume;
    private createContainer;
    private createWorkload;
    toJson(): any;
}
