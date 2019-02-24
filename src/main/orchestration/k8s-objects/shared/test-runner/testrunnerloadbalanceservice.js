"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loadbalancer_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/loadbalancer/loadbalancer");
const serviceport_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/ports/serviceport");
class TestRunnerLoadBalanceService {
    constructor(name, namespace, loadBalancerIp) {
        this.service = new loadbalancer_1.default(name, namespace);
        this.service.setLoadBalancerIp(loadBalancerIp);
        const port = new serviceport_1.default(undefined, 80);
        port.setTargetPort(3000);
        this.service.addServicePort(port);
        this.service.addMatchLabel("app", "test-runner");
    }
    toJson() {
        return this.service.toJson();
    }
}
exports.default = TestRunnerLoadBalanceService;
//# sourceMappingURL=testrunnerloadbalanceservice.js.map