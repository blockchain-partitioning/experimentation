"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const affinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity");
const antiaffinity_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity");
const term_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term");
const weightedterm_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/weightedterm");
class PreferredPeerAntiAffinity extends affinity_1.default {
    constructor() {
        super();
        this.affinity = new affinity_1.default();
        const antiAffinity = new antiaffinity_1.default();
        const weightedTerm = new weightedterm_1.default();
        const term = new term_1.default();
        term.addMatchLabel("role", "peer");
        term.setTopologyKey("kubernetes.io/hostname");
        term.addNamespace("org1");
        term.addNamespace("ordererorg");
        weightedTerm.setPodAffinityTerm(term);
        antiAffinity.addPreferredPodAffinityTerm(weightedTerm);
        this.affinity.setAntiAffinity(antiAffinity);
    }
    toJson() {
        return this.affinity.toJson();
    }
}
exports.default = PreferredPeerAntiAffinity;
;
//# sourceMappingURL=preferredpeerantiaffinity.js.map