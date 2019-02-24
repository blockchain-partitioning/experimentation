const Configuration = require('../config');
const Util = require('./util');

(async () => {
    await Util.runCommandOnClusters('delete', 'docker', createArguments);
})();

function createArguments(cluster) {
    let arguments = ["run"];
    arguments = Util.addVolumes(arguments, cluster);
    arguments = Util.addEnvironmentVariables(arguments);
    arguments = Util.addKopsImageArguments(arguments);
    arguments.push("delete");
    arguments = Util.addKopsClusterFiles(arguments);
    arguments.push(`--state=${Configuration.infrastructure.bucketName}`);
    arguments.push("--yes");

    return arguments;
}