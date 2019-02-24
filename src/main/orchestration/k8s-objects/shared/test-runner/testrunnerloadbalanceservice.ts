import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import LoadBalancerService
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/loadbalancer/loadbalancer";
import ServicePort
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/discovery-load-balancing/services/ports/serviceport";

export default class TestRunnerLoadBalanceService implements IResource {
    private service: LoadBalancerService;

    constructor(name: string, namespace: string, loadBalancerIp: string) {
        this.service = new LoadBalancerService(name, namespace);
        this.service.setLoadBalancerIp(loadBalancerIp);
        const port = new ServicePort(undefined, 80);
        port.setTargetPort(3000);
        this.service.addServicePort(port);
        this.service.addMatchLabel("app", "test-runner");
    }

    toJson(): any {
        return this.service.toJson();
    }
}