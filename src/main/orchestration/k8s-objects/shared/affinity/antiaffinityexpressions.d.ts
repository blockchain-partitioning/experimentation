import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";
export default class FabricAntiAffinity extends Affinity {
    toJson(): {
        "podAntiAffinity": {
            "requiredDuringSchedulingIgnoredDuringExecution": {
                "labelSelector": {
                    "matchExpressions": {
                        "key": string;
                        "operator": string;
                        "values": string[];
                    }[];
                };
                "namespaces": string[];
                "topologyKey": string;
            }[];
        };
    };
}
