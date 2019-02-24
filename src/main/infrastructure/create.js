const Configuration = require('../config');
const Util = require('./util');

(async () => {
    await Util.runCommandOnClusters('create', 'docker', createArguments);
})();

function createArguments(cluster) {
    let arguments = ["run"];
    arguments = Util.addVolumes(arguments, cluster);
    arguments = Util.addEnvironmentVariables(arguments);
    arguments = Util.addKopsImageArguments(arguments);
    arguments.push("create");
    arguments = Util.addKopsClusterFiles(arguments);
    arguments.push(`--state=${Configuration.infrastructure.bucketName}`);

    return arguments;
}