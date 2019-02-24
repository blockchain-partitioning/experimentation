"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity");
class FabricAntiAffinity extends affinity_1.default {
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
        };
    }
}
exports.default = FabricAntiAffinity;
// requiredDuringSchedulingIgnoredDuringExecution:
//     - labelSelector:
// matchExpressions:
//     - key: security
// operator: In
// values:
//     - S1
//# sourceMappingURL=antiaffinityexpressions.js.map