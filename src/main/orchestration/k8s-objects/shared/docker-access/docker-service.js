"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodeport_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/nodeport/nodeport");
const nodeport_2 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/ports/nodeport");
class DockerService {
    constructor() {
        this.daemonSetService = new nodeport_1.default("http-docker-access", "kube-system");
        this.daemonSetService.addMatchLabel("name", "http-docker-access");
        const nodePort = new nodeport_2.default(undefined, 2375);
        nodePort.setTargetPort(2375);
        nodePort.setNodePort(31000);
        this.daemonSetService.addServicePort(nodePort);
    }
    toJson() {
        return this.daemonSetService.toJson();
    }
}
exports.default = DockerService;
//# sourceMappingURL=docker-service.js.map