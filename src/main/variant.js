const Clusters = require('./infrastructure/clusters');
const Dashboards = require('./orchestration/dashboards');
const K8sObjects = require('./orchestration/k8s-objects');
const K8sNetworks = require('./orchestration/k8s-networks');
const Experiments = require('./application/experiment');

class Variant {
    constructor(configuration) {
        this.configuration = configuration;
        this.dashboards = new Dashboards(configuration);
        this.networks = new K8sNetworks(this.configuration);
        this.experiments = new Experiments(this.configuration);
        this.clusters = new Clusters(this.configuration);
    }

    async createAndDeployClusters() {
        await this.clusters.createAll();
        await this.clusters.deployAll();
        return this.clusters.verifyClustersAreDeployed();
    }

    async deployNetworks() {
        await this.networks.deployAll();
        return this.networks.verifyNetworksAreDeployed();
    }

    async deployDashboards(){
        await this.dashboards.deployAll();
        return this.dashboards.openAll();
    }

    createK8sObjects(){
        return K8sObjects.createAll(this.configuration);
    }

    async takeSamples(amountOfSamples) {
        for (let i = 0; i < amountOfSamples; i++) {
            console.log("Starting sample:", i + 1);
            await this.deployNetworks();
            await this.takeSample();
            await this.deleteNetworks()
        }
    }

    async takeSample() {
        try {
            await this.startExperiments();
            this.clear();
            await this.stopExperiments();
        }
        catch (e) {
            console.error("Error taking sample:", e);
            console.log("Retrying...");
            this.clear();
            await this.deleteNetworks();
            await this.deployNetworks();
            await this.takeSample();
        }
    }


    async startExperiments() {
        await this.experiments.start();
        return this.experiments.verifyExperimentsAreFinished();
    }

    stopExperiments() {
        const delayInMinutes = 5;
        return new Promise(async (resolve, reject) => {
            if (this.configuration.clusters.length > 1) {
                console.log("Waiting ", delayInMinutes, "minute(s) to let root cluster finish queued transactions.");
                setTimeout(async () => {
                    try {
                        await this.experiments.stop();
                        await this.experiments.downloadDataDumps();
                        resolve();
                    } catch (e) {
                        reject(e)
                    }
                }, delayInMinutes * 60 * 1000);
            }
            else {
                try {
                    await this.experiments.stop();
                    await this.experiments.downloadDataDumps();
                    resolve();
                } catch (e) {
                    reject(e)
                }
            }
        })
    }

    async deleteNetworks() {
        await this.networks.deleteAll();
        return this.networks.verifyNetworksAreDeleted();
    }

    deleteClusters() {
        return this.clusters.deleteAll();
    }

    downloadDataDumps() {
        return this.experiments.downloadDataDumps();
    }

    clear() {
        this.experiments.clearRoundStateChecks();
    }

    isFinished() {
        return this.experiments.verifyExperimentsAreFinished();
    }

    continueExperiments(){
         return this.experiments.continue();
    }
}

module.exports = Variant;