const ChildProcess = require('child_process');

function promisifyProcess(processName, arguments) {
    const spawnedProcess = ChildProcess.spawn(processName, arguments);
    return new Promise((resolve, reject) => {

        spawnedProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        spawnedProcess.stderr.on('data', (data) => {
            console.error(`${data}`);
        });

        spawnedProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`${processName} exited with code ${code}`);
                reject();
            }
            else {
                resolve()
            }
        });

    });
}

function printCommand(processName, arguments){
    console.log(`${processName} ${arguments}`)
}

async function runCommandOnClusters(command, process, processArgumentsCallBack, configuration) {
    for (let i = 0; i < configuration.clusters.length; i++) {
        const cluster = configuration.clusters[i];
        try {
            await runCommandOnCluster(command, cluster, process, processArgumentsCallBack);
        }
        catch (e) {
            console.error(e);
        }
    }
}

function runCommandOnCluster(command, cluster, process, processArgumentsCallBack) {
    console.log(`Running "${command}" command on directory: ${cluster.infrastructure.path}`);
    return promisifyProcess(process, processArgumentsCallBack(cluster));
}

function addVolumes(arguments, cluster, configuration) {
    arguments = addVolume(arguments, `${configuration.infrastructure.googleCloudDirectory}:/gcloud/`);
    arguments = addVolume(arguments, `${cluster.infrastructure.path}:/root/`);
    arguments = addVolume(arguments, `${configuration.infrastructure.kubernetesConfigurationDirectory}:/root/.kube`);
    arguments = addVolume(arguments, `${configuration.infrastructure.sshDirectory}:/root/.ssh`);

    return arguments
}

function addVolume(arguments, pathLink) {
    arguments.push("-v");
    arguments.push(pathLink);
    return arguments
}

function addEnvironmentVariables(arguments) {
    arguments = addEnvironmentVariable(arguments, "GOOGLE_APPLICATION_CREDENTIALS=/gcloud/application_default_credentials.json");
    arguments = addEnvironmentVariable(arguments, "KOPS_FEATURE_FLAGS=AlphaAllowGCE");
    return arguments;
}

function addEnvironmentVariable(arguments, variable) {
    arguments.push("-e");
    arguments.push(variable);
    return arguments;
}

function addKopsImageArguments(arguments) {
    arguments.push("-i",);
    arguments.push("robertdiebels/kops:1.9.1");
    return arguments;
}

function addKopsClusterFiles(arguments) {
    arguments = addKopsClusterFile(arguments, "/root/cluster.yaml");
    arguments = addKopsClusterFile(arguments, "/root/masters.yaml");
    arguments = addKopsClusterFile(arguments, "/root/nodes.yaml");
    arguments = addKopsClusterFile(arguments, "/root/loadgenerator.yaml");
    return arguments;
}

function addKopsClusterFile(arguments, path) {
    arguments.push("-f");
    arguments.push(path);
    return arguments;
}


module.exports = {
    runCommandOnClusters,
    addVolumes,
    addEnvironmentVariables,
    addKopsImageArguments,
    addKopsClusterFiles
};
