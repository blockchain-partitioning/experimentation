const ChildProcess = require('child_process');
const Configuration = require("../config");

(async () => {
    await createManifestsForClusters();
})();

async function createManifestsForClusters() {
    for (let i = 0; i < Configuration.clusters.length; i++) {
        const cluster = Configuration.clusters[i];
        await createClusterManifests(cluster)
    }
}

async function createClusterManifests(cluster) {
    return new Promise((resolve) => {
        // Need to fork the process since the Fabric binaries that are used for generation lock the tempDirectory.
        // Preventing the tempDirectory from being removed.
        const process = ChildProcess.fork('./create-manifest.js', [JSON.stringify(cluster)]);
        process.on('exit', () => {
            resolve();
        });
    });
}