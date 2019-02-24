const Kubechain = require('kubechain/src/main/lib/kubechain/kubechain').default;
const FabricClusterCreator = require("kubechain/src/main/lib/blockchains/fabric/kubernetes/cluster/create").default;
const Configuration = require('../config');

const creator = new FabricClusterCreator();

(async ()=>{
    await createNetworks();
})();

async function createNetworks() {
    console.log("Creating clusters...");
    for (let i = 0; i < Configuration.clusters.length; i++) {
        const cluster = Configuration.clusters[i];
        await createCluster(cluster);
    }
    console.log("Done creating clusters.")
}

async function createCluster(cluster) {
    console.log("Creating cluster:", cluster.name);
    try {
        const kubechain = createKubechain(cluster);
        await creator.create(kubechain);
    } catch (e) {
        console.error('Cannot create cluster', cluster.orchestration.context, ". Reason:", e)
    }
}

function createKubechain(cluster) {
    const kubechain = new Kubechain(undefined);
    const options = {
        name: cluster.name,
        targets: {
            blockchain: "fabric",
            kubernetes: "gce"
        },
        kubernetes: {
            context: cluster.orchestration.context
        },
        paths: {
            root: "",
            configuration: "",
            blockchains: "",
            kubernetes: cluster.orchestration.path
        },
        adapter: {
            hooks: {},
            options: {}
        }
    };
    kubechain.setOptions(options);
    return kubechain;
}
