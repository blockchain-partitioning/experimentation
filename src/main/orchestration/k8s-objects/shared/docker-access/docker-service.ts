import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import NodePortService from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/nodeport/nodeport";
import NodeServicePort from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/ports/nodeport";

export default class DockerService implements IResource {
    private daemonSetService: NodePortService;

    constructor() {
        this.daemonSetService = new NodePortService("http-docker-access", "kube-system");
        this.daemonSetService.addMatchLabel("name", "http-docker-access");
        const nodePort = new NodeServicePort(undefined, 2375);
        nodePort.setTargetPort(2375);
        nodePort.setNodePort(31000);
        this.daemonSetService.addServicePort(nodePort);
    }

    toJson(): any {
        return this.daemonSetService.toJson();
    }
}