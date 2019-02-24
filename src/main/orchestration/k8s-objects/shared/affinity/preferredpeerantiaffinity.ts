import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";
import PodAntiAffinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity";
import PodAffinityTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term";
import WeightedPodAffinityTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/weightedterm";

export default class PreferredPeerAntiAffinity extends Affinity {
    private affinity: Affinity;

    constructor() {
        super();
        this.affinity = new Affinity();
        const antiAffinity = new PodAntiAffinity();
        const weightedTerm = new WeightedPodAffinityTerm();
        const term = new PodAffinityTerm();
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
};