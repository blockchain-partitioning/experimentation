import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";

export default class FabricAntiAffinity extends Affinity {
    toJson() {
        return {
            "podAntiAffinity": {
                "requiredDuringSchedulingIgnoredDuringExecution": [
                    {
                        "labelSelector": {
                            "matchExpressions": [
                                {
                                    "key": "role",
                                    "operator": "In",
                                    "values": ["peer", "orderer"]
                                }
                            ]
                        },
                        "namespaces": [
                            "org1",
                            "ordererorg"
                        ],
                        "topologyKey": "kubernetes.io/hostname"
                    }
                ]
            }
        }
    }
}

// requiredDuringSchedulingIgnoredDuringExecution:
//     - labelSelector:
// matchExpressions:
//     - key: security
// operator: In
// values:
//     - S1