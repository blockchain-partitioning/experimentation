import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
export default class TestRunnerLoadBalanceService implements IResource {
    private service;
    constructor(name: string, namespace: string, loadBalancerIp: string);
    toJson(): any;
}
