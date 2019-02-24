import Namespace from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/cluster/namespace";
import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";

export default class TestRunnerNamespace implements IResource{
    private namespace: Namespace;
    constructor(){
        this.namespace = new Namespace("test-runner")
    }

    toJson(){
        return this.namespace.toJson();
    }
}