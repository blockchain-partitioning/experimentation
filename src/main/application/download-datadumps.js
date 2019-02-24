const Path = require('path');
const Fs = require('fs-extra');
const Request = require('request');
const Tar = require('tar');
const Configuration = require('../config');

(async () => {
    try {
        console.log("Downloading datadumps...");
        await downloadDataDumps();
        console.log("Downloaded datadumps.");
    }
    catch (e) {
        console.error("Unexpected error:", e);
    }
})();

async function downloadDataDumps() {
    const clusters = Configuration.clusters;
    for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        try {
            await downloadDataDump(cluster)
        }
        catch (e) {
            console.error("Error downloading datadump. Reason:", e);
        }
    }
}

function downloadDataDump(cluster) {
    return new Promise((resolve => {
        Fs.ensureDirSync(cluster.results.path);
        const url = `http://${cluster.application.testRunnerExternalIpAddress}/data/download`;
        const filePath = Path.join(__dirname, 'temp.tgz');
        console.log("Downloading data for:", cluster.name);
        Request.get(url, () => {
            Tar.x({
                file: filePath,
                sync: true,
                C: cluster.results.path // alias for cwd:'some-dir', also ok
            });
            console.log("Done");
            resolve();
        }).pipe(Fs.createWriteStream(filePath));
    }));
}


Configuration.clusters.forEach((cluster) => {

});
