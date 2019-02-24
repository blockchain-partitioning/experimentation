import Affinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/affinity";
import PodAntiAffinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/antiaffinity";
import PodAffinityTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/terms/term";
import NodeAffinity from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/nodeaffinity";
import NodeSelector from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/selector";
import NodeSelectorTerm from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/terms/selector";
import NodeSelectorRequirement
    from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/pod/affinity/node/terms/requirement";

export default class RequiredPeerAntiAffinity extends Affinity {
    private affinity: Affinity;

    constructor() {
        super();
        this.affinity = new Affinity();
        const antiAffinity = new PodAntiAffinity();
        const term = new PodAffinityTerm();
        term.addMatchLabel("role", "peer");
        term.setTopologyKey("kubernetes.io/hostname");
        term.addNamespace("org1");
        term.addNamespace("ordererorg");
        antiAffinity.addRequiredPodAffinityTerm(term);
        this.affinity.setAntiAffinity(antiAffinity);
        const nodeAffinity = new NodeAffinity();
        const selector = new NodeSelector();
        const nodeTerm = new NodeSelectorTerm();
        const requirement =  new NodeSelectorRequirement("kops.k8s.io/instancegroup", "NotIn");
        requirement.addValue("loadgenerator");
        nodeTerm.addNodeSelctorRequirement(requirement);
        selector.addNodeSelectorTerm(nodeTerm);
        nodeAffinity.setNodeSelector(selector);
        this.affinity.setNodeAffinity(nodeAffinity);
    }

    toJson() {
        return this.affinity.toJson();
    }
};