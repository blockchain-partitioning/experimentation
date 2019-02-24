import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
export default class TestRunnerNamespace implements IResource {
    private namespace;
    constructor();
    toJson(): {
        "apiVersion": string;
        "kind": string;
        "metadata": {
            "name": string;
        };
    };
}
