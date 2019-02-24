const KubernetesClient = require('kubernetes-client');
const Util = require('./auto-run-util');

class Clusters {
    constructor(configuration) {
        this.configuration = configuration;
    }

    async createAll() {
        return Util.runCommandOnClusters('create', 'docker', (cluster)=>{return this.createArguments(cluster)}, this.configuration);
    }

    createArguments(cluster) {
        let args = ["run"];
        args = Util.addVolumes(args, cluster, this.configuration);
        args = Util.addEnvironmentVariables(args);
        args = Util.addKopsImageArguments(args);
        args.push("create");
        args = Util.addKopsClusterFiles(args);
        args.push(`--state=${this.configuration.infrastructure.bucketName}`);

        return args;
    }

    async deployAll() {
        await Util.runCommandOnClusters('deploy', 'docker', (cluster)=>{return this.deployArguments(cluster)}, this.configuration);
    }

    deployArguments(cluster) {
        let args = ["run"];
        args = Util.addVolumes(args, cluster, this.configuration);
        args = Util.addEnvironmentVariables(args);
        args = Util.addKopsImageArguments(args);
        args.push("update");
        args.push("cluster");
        args.push(cluster.orchestration.context);
        args.push(`--state=${this.configuration.infrastructure.bucketName}`);
        args.push("--yes");

        return args;
    }

    async verifyClustersAreDeployed() {
        return new Promise(((resolve, reject) => {
            console.log("Waiting 6 minutes for Kops to wrap up deploying clusters...");
            setTimeout(async ()=>{
                const promises = this.configuration.clusters.map(cluster =>{
                    return this.verifyClusterIsDeployed(cluster);
                });
                await Promise.all(promises);
                resolve();
            }, 6 * 60 * 1000); // Wait a minimum of 4.5 minutes for the clusters to boot. Then verify deployments.
        }))

    }

    verifyClusterIsDeployed(cluster){
        const client = this.createClientForCluster(cluster);
        const delay = 30 * 1000;
        return new Promise((resolve, reject) => {
            const verificationInterval = setInterval(async () => {
                try{
                    await client.api.v1.namespaces.get();
                    clearInterval(verificationInterval);
                    resolve();
                }catch (e) {
                    console.log("Cluster:", cluster.name, "not yet deployed. Retrying in:", 30, "(s)");
                }
            }, delay);
        })
    }

    createClientForCluster(cluster) {
        const config = KubernetesClient.config;
        return new KubernetesClient.Client({
            config: config.fromKubeconfig(undefined, cluster.orchestration.context),
            version: '1.8'
        });
    }

    async deleteAll() {
        return Util.runCommandOnClusters('delete', 'docker', (cluster)=>{return this.deleteArguments(cluster)}, this.configuration);
    }

    deleteArguments(cluster) {
        let args = ["run"];
        args = Util.addVolumes(args, cluster, this.configuration);
        args = Util.addEnvironmentVariables(args);
        args = Util.addKopsImageArguments(args);
        args.push("delete");
        args = Util.addKopsClusterFiles(args);
        args.push(`--state=${this.configuration.infrastructure.bucketName}`);
        args.push("--yes");

        return args;
    }

    validateAll(){
        return Util.runCommandOnClusters('validate', 'docker', (cluster)=>{return this.validateArguments(cluster)}, this.configuration);
    }

    validateArguments(cluster){
        let args = ["run"];
        args = Util.addVolumes(args, cluster, this.configuration);
        args = Util.addEnvironmentVariables(args);
        args = Util.addKopsImageArguments(args);
        args.push("validate");
        args.push("cluster");
        args.push(cluster.orchestration.context);
        args.push(`--state=${this.configuration.infrastructure.bucketName}`);

        return args;
    }

    rollingUpdateAll(){
        return Util.runCommandOnClusters('rolling-update', 'docker', (cluster)=>{return this.rollingUpdateArguments(cluster)}, this.configuration);
    }

    rollingUpdateArguments(cluster){
        let args = ["run"];
        args = Util.addVolumes(args, cluster, this.configuration);
        args = Util.addEnvironmentVariables(args);
        args = Util.addKopsImageArguments(args);
        args.push("rolling-update");
        args.push("cluster");
        args.push(cluster.orchestration.context);
        args.push(`--state=${this.configuration.infrastructure.bucketName}`);
        args.push("--yes")
    }

    describeAll(){

    }
}


module.exports = Clusters;