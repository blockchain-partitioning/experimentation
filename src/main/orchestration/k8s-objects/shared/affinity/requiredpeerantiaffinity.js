"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity");
const antiaffinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity");
const term_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term");
const nodeaffinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/nodeaffinity");
const selector_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/selector");
const selector_2 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/terms/selector");
const requirement_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/terms/requirement");
class RequiredPeerAntiAffinity extends affinity_1.default {
    constructor() {
        super();
        this.affinity = new affinity_1.default();
        const antiAffinity = new antiaffinity_1.default();
        const term = new term_1.default();
        term.addMatchLabel("role", "peer");
        term.setTopologyKey("kubernetes.io/hostname");
        term.addNamespace("org1");
        term.addNamespace("ordererorg");
        antiAffinity.addRequiredPodAffinityTerm(term);
        this.affinity.setAntiAffinity(antiAffinity);
        const nodeAffinity = new nodeaffinity_1.default();
        const selector = new selector_1.default();
        const nodeTerm = new selector_2.default();
        const requirement = new requirement_1.default("kops.k8s.io/instancegroup", "NotIn");
        requirement.addValue("loadgenerator");
        nodeTerm.addNodeSelctorRequirement(requirement);
        selector.addNodeSelectorTerm(nodeTerm);
        nodeAffinity.setNodeSelector(selector);
        this.affinity.setNodeAffinity(nodeAffinity);
    }
    toJson() {
        return this.affinity.toJson();
    }
}
exports.default = RequiredPeerAntiAffinity;
;
//# sourceMappingURL=requiredpeerantiaffinity.js.map