const ChildProcess = require('child_process');

async function createAll(configuration) {
    for (let i = 0; i < configuration.clusters.length; i++) {
        const cluster = configuration.clusters[i];
        await createClusterK8sObjects(cluster)
    }
}

async function createClusterK8sObjects(cluster) {
    return new Promise((resolve) => {
        // Need to fork the process since the Fabric binaries that are used for generation lock the tempDirectory.
        // Preventing the tempDirectory from being removed.
        const process = ChildProcess.fork('./orchestration/create-k8s-objects.js', [JSON.stringify(cluster)]);
        process.on('exit', () => {
            resolve();
        });
    });
}

module.exports = {createAll};
