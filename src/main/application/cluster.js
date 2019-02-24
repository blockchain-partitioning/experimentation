const Path = require('path');
const Fs = require('fs-extra');
const Request = require('request-promise-native');
const Tar = require('tar');


class Cluster {
    constructor(configuration, rootClusterIpAddress) {
        this.configuration = configuration;
        this.rootTestRunnerExternalIpAddress = rootClusterIpAddress;
        this.lastRound = {};
        this.roundStateInterval;
    }

    isNotARootCluster() {
        return this.rootTestRunnerExternalIpAddress !== this.configuration.application.testRunnerExternalIpAddress
    }

    verifyExperimentIsFinished() {
        return this.verifyExperimentIsInState("finished")
    }

    clearVerificationInterval() {
        clearInterval(this.verificationInterval)
    }

    verifyExperimentIsBusy() {
        return this.verifyExperimentIsInState("busy")
    }

    verifyExperimentIsInState(state) {
        const errorState = "error";
        console.log(`Verifying if experiment is ${state}..`);
        return new Promise((resolve, reject) => {
            const delay = 15 * 1000;
            this.verificationInterval = setInterval(async () => {
                const url = `http://${this.configuration.application.testRunnerExternalIpAddress}/status`;
                try {
                    await Request(url, (error, response, body) => {
                        console.log("Cluster:", this.configuration.name, ", status:", body);
                        if (body) {
                            if (body === state) {
                                this.clearVerificationInterval();
                                resolve();
                            }
                            if (body === errorState) {
                                this.clearVerificationInterval();
                                reject("Experiment is in error state for cluster:", this.configuration.name);
                            }
                        }
                    });
                }
                catch (e) {
                    console.error("Error during root cluster verification:", e.message || e);
                }
            }, delay);
        });
    }

    downloadDataDump() {
        return new Promise(async (resolve, reject) => {
            try {
                Fs.ensureDirSync(this.configuration.results.path);
                const url = `http://${this.configuration.application.testRunnerExternalIpAddress}/data/download`;
                const filePath = Path.join(__dirname, 'temp.tgz');
                console.log("Downloading data for:", this.configuration.name);
                Request.get(url, async (error) => {
                    if (error) {
                        reject(error);
                    }
                    try {
                        await new Promise((resolve, reject) => {
                            //Wait a little for piping to finish.
                            setTimeout(() => {
                                try {
                                    console.log("Unzipping tar-file...");
                                    Tar.x({
                                        file: filePath,
                                        sync: true,
                                        C: this.configuration.results.path // alias for cwd:'some-dir', also ok
                                    });
                                    console.log("Done unzipping.");
                                    resolve();
                                } catch (e) {
                                    reject(e);
                                }

                            }, 1000)
                        });
                        resolve()
                    }
                    catch (e) {
                        reject(e);
                    }
                }).pipe(Fs.createWriteStream(filePath));
            }
            catch (e) {
                reject(e);
            }
        });
    }

    checkRoundState() {
        const interval = 7500;
        const url = `http://${this.configuration.application.testRunnerExternalIpAddress}/round/status`;
        const logInterval = setInterval(async () => {
            try {
                await Request(url, (error, response, body) => {
                    try {
                        if (body) {
                            const contents = JSON.parse(body);
                            if (contents && contents.transactions) {
                                console.log(`Status for round ${contents.name} in cluster ${this.configuration.name}: ${contents.status}.`);
                                // \n Submitted - ${contents.transactions.submitted} \n Unfinished - ${contents.transactions.unfinished} \n Failed - ${contents.transactions.failed} \n Succeeded - ${contents.transactions.succeeded}
                                // this.checkRoundStateChange(this.configuration.name, contents);
                            }
                        }
                    }
                    catch (e) {
                        console.error("Error occurred during round logging.", e);
                    }
                })
            } catch (e) {
                console.error("Error occurred during round logging.", e);
            }
        }, interval);

        this.roundStateInterval = logInterval;
    }

    checkRoundStateChange(currentRound) {
        if (this.lastRound === undefined) {
            this.lastRound = currentRound;
            return;
        }
        if (currentRound.name !== 'unknown' && this.lastRound.name !== currentRound.name) {
            this.downloadDataDump().then(() => {
                this.lastRound = currentRound;
            }).catch(ignore => ignore);
        }
    }

    clearRoundStateInterval() {
        clearInterval(this.roundStateInterval);
    }

    stop() {
        this.clearRoundStateInterval();
        this.clearVerificationInterval();
    }
}

module.exports = Cluster;