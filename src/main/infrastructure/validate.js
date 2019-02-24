const Configuration = require('../config');
const Util = require('./util');

(async () => {
    await Util.runCommandOnClusters('validate', 'docker', createArguments);
})();

function createArguments(cluster) {
    let arguments = ["run"];
    arguments = Util.addVolumes(arguments, cluster);
    arguments = Util.addEnvironmentVariables(arguments);
    arguments = Util.addKopsImageArguments(arguments);
    arguments.push("validate");
    arguments.push("cluster");
    arguments.push(cluster.orchestration.context);
    arguments.push(`--state=${Configuration.infrastructure.bucketName}`);

    return arguments;
}