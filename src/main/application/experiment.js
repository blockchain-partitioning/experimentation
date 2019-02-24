const Request = require('request-promise-native');
const Cluster = require('./cluster');

class Experiment {
    constructor(configuration) {
        this.configuration = configuration;
        this.alreadyDownloading = false;
        this.clusters = configuration.clusters.map((clusterConfiguration) => {
            return new Cluster(clusterConfiguration, configuration.application.rootTestRunnerExternalIpAddress);
        });
    }

    async start() {
        console.log("Starting experiment...");
        try {
            const url = `http://${this.configuration.application.rootTestRunnerExternalIpAddress}/start`;
            await Request.get(url);
            this.checkRoundStates();
        } catch (e) {
            console.log("Failed to start experiment. Retrying in: 30 (s). Reason:", e.message);
            setTimeout(async () => {
                await this.start();
            }, 30000);

        }
    }

    async continue() {
        this.checkRoundStates();
        return this.verifyExperimentsAreFinished();
    }

    async verifyExperimentsAreFinished() {
        return new Promise((resolve, reject) => {
            const delay = 45000;
            const promises = [];
            console.log(`Waiting: ${delay / 1000}(s) before verifying experiment status.`); // Sometimes the state of a test-runner is undefined causing it to fail. Give it some breathing space to get running.
            setTimeout(async () => {
                for (let i = 0; i < this.clusters.length; i++) {
                    const cluster = this.clusters[i];
                    if (cluster.isNotARootCluster() || this.hasOnlyOneCluster()) {
                        const promise = cluster.verifyExperimentIsFinished();
                        promises.push(promise);
                    }
                    else {
                        promises.push(cluster.verifyExperimentIsBusy());
                    }
                }
                try {
                    await Promise.all(promises);
                    this.clearVerificationIntervals();
                    resolve()
                } catch (e) {
                    this.clearVerificationIntervals();
                    reject(e);
                }
            }, delay);
        });
    }

    hasOnlyOneCluster() {
        return this.clusters.length === 1
    }

    isNotARootCluster(cluster) {
        return this.configuration.application.rootTestRunnerExternalIpAddress !== cluster.application.testRunnerExternalIpAddress
    }

    clearVerificationIntervals() {
        this.clusters.forEach((cluster) => {
            cluster.clearVerificationInterval();
        });
    }

    async downloadDataDumps() {
        if (!this.alreadyDownloading) {
            console.log("Downloading datadumps...");
            this.alreadyDownloading = true;
            try {
                for (let i = 0; i < this.clusters.length; i++) {
                    const cluster = this.clusters[i];
                    try {
                        await cluster.downloadDataDump();
                    }
                    catch (e) {
                        console.error("Error downloading datadump. Reason:", e);
                        throw e;
                    }
                }
                this.alreadyDownloading = false;
            }
            catch (e) {
                console.log("Retrying...");
                this.alreadyDownloading = false;
                await this.downloadDataDumps();
            }
            console.log("Downloaded datadumps.");
        }
    }

    checkRoundStates() {
        const delay = 0;
        setTimeout(() => {
            console.log(`Waiting: ${delay / 1000}(s) before verifying round status.`); // Sometimes the state of a test-runner is undefined causing it to fail. Give it some breathing space to get running.
            for (let i = 0; i < this.clusters.length; i++) {
                const cluster = this.clusters[i];
                if (cluster.isNotARootCluster() || this.hasOnlyOneCluster()) {
                    cluster.checkRoundState();
                }
            }
        }, delay);
    }

    clearRoundStateChecks() {
        this.clusters.forEach((cluster) => {
            cluster.clearRoundStateInterval();
        });
    }

    async stop() {
        console.log("Stopping experiment...");
        try {
            const url = `http://${this.configuration.application.rootTestRunnerExternalIpAddress}/stop`;
            await
                Request.get(url);
        } catch (e) {
            console.log("Failed to stop experiment. Retyring in: 30 (s)");
            setTimeout(async () => {
                await this.stop();
            }, 30000);
        }
        this.clusters.forEach(cluster => {
            cluster.stop();
        })
    }
}

module.exports = Experiment;