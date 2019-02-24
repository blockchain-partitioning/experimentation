const KubernetesClient = require('kubernetes-client');
const Kubechain = require('kubechain/src/main/lib/kubechain/kubechain').default;
const FabricClusterCreator = require("kubechain/src/main/lib/blockchains/fabric/kubernetes/cluster/create").default;
const FabricClusterDeleter = require("kubechain/src/main/lib/blockchains/fabric/kubernetes/cluster/delete").default;


class K8sNetworks {
    constructor(configuration) {
        this.configuration = configuration;
        this.namespaces = ['test-runner', 'org1', "ordererorg"];
    }

    async deployAll() {
        console.log("Deploying networks...");
        for (let i = 0; i < this.configuration.clusters.length; i++) {
            const cluster = this.configuration.clusters[i];
            await this.deployNetwork(cluster);
        }
        console.log("Done deploying networks.")
    }

    async deployNetwork(cluster) {
        console.log("Deploying network:", cluster.name);
        try {
            const kubechain = this.createKubechainForCluster(cluster);
            const creator = new FabricClusterCreator();
            await creator.create(kubechain);
        } catch (e) {
            console.error('Cannot deploy network', cluster.orchestration.context, ". Reason:", e);
            console.error('Retrying...');
            await this.deleteNetworkInCluster(cluster);
            await this.verifyNetworkDeletedFromCluster(cluster);
            await this.deployNetwork(cluster)
        }
    }

    async verifyNetworksAreDeployed() {
        console.log("Verifying deployments are ready...");
        const promises = [];
        const clusters = this.configuration.clusters;
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            promises.push(this.verifyNetworkDeployedInCluster(cluster));
        }
        return Promise.all(promises);
    }

    verifyNetworkDeployedInCluster(cluster) {
        console.log("Verifying networks are deployed for cluster:", cluster.name);
        return new Promise((resolve, reject) => {
            const delay = 30 * 1000;
            const verificationInterval = setInterval(async () => {
                const client = this.createClientForCluster(cluster);
                try {
                    await this.verifyNetworkNamespacesAreDeployed(client);
                    clearInterval(verificationInterval);
                    console.log("Fabric has been deployed in:", cluster.name);
                    resolve();
                }
                catch (e) {
                    console.error("Error verifying Fabric deployment for Cluster:", cluster.name, ". Reason:", e);
                }
            }, delay);
        });
    }

    verifyNetworkNamespacesAreDeployed(client) {
        const promises = [];
        for (let i = 0; i < this.namespaces.length; i++) {
            const namespace = this.namespaces[i];
            promises.push(this.verifyDeploymentsAreReadyForNamespace(client, namespace))
        }
        return Promise.all(promises);
    }

    verifyDeploymentsAreReadyForNamespace(client, namespace) {
        console.log("Checking namespace:", namespace);
        return new Promise(async (resolve, reject) => {
            try {
                const response = await client.apis.apps.v1beta1.namespaces(namespace).deployments.get();
                if (this.deploymentsAreReady(response.body.items)) {
                    resolve();
                }
                reject();
            }
            catch (e) {
                console.error(e);
                reject(e);
            }
        })
    }

    deploymentsAreReady(deployments) {
        return deployments.reduce((previousValue, deployment) => {
            console.log("Checking deployment:", deployment.metadata.name);
            return previousValue && deployment.status.availableReplicas === deployment.status.replicas;
        }, true)
    }

    async deleteAll() {
        console.log("Deleting networks...");
        for (let i = 0; i < this.configuration.clusters.length; i++) {
            const cluster = this.configuration.clusters[i];
            await this.deleteNetworkInCluster(cluster);
        }
        console.log("Done deleting networks.");
    }

    async deleteNetworkInCluster(cluster) {
        console.log("Deleting network:", cluster.name);
        try {
            const kubechain = this.createKubechainForCluster(cluster);
            const deleter = new FabricClusterDeleter();
            await deleter.delete(kubechain);
        } catch (e) {
            console.error('Cannot delete network', cluster.orchestration.context, ". Reason:", e);
        }
    }

    async verifyNetworkDeletedFromCluster(cluster) {
        const client = this.createClientForCluster(cluster);
        return new Promise((resolve, reject) => {
            const delay = 15 * 1000;
            const verificationInterval = setInterval(async () => {
                try {
                    await this.verifyNamespacesDoNotExist(client);
                    clearInterval(verificationInterval);
                    console.log("Network,", cluster.name, "has been removed.");
                    resolve()
                }
                catch (e) {
                    console.log("Could not remove network from cluster:", cluster.name, "retrying in: ", 15, "(s). Reason:", e);
                }
            }, delay);
        });
    }

    async verifyNamespacesDoNotExist(client) {
        const promises = [];
        for (let i = 0; i < this.namespaces.length; i++) {
            const namespace = this.namespaces[i];
            try {
                const response = await client.api.v1.namespaces(namespace).get();
                if (response.body && response.body.status) {
                    console.log("Found namespace:", namespace, "Phase:", response.body.status.phase);
                    promises.push(Promise.reject());
                }
            }
            catch (e) {
                promises.push(Promise.resolve());
            }
        }
        return Promise.all(promises);
    }


    createKubechainForCluster(cluster) {
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

    async verifyNetworksAreDeleted() {
        console.log("Verifying networks have been deleted...");
        const promises = [];
        const clusters = this.configuration.clusters;
        for (let i = 0; i < clusters.length; i++) {
            const cluster = clusters[i];
            promises.push(this.verifyNetworkDeletedFromCluster(cluster));
        }
        return Promise.all(promises);
    }


    createClientForCluster(cluster) {
        const config = KubernetesClient.config;
        return new KubernetesClient.Client({
            config: config.fromKubeconfig(undefined, cluster.orchestration.context),
            version: '1.8'
        });
    }
}

module.exports = K8sNetworks;