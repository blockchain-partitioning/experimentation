const Path = require('path');
const Client = require('kubernetes-client').Client;
const config = require('kubernetes-client').config;
const Fs = require('fs-extra');
const Configuration = require("../config");

(async()=>{
    try {
        console.log("Creating dashboards...");
        await createDashboards(1);
        console.log("Created dashboards.");
    }
    catch (e){
        console.error("Unexpected error:", e);
    }
})();


async function createDashboards() {
    const clusterContexts = Configuration.orchestration.clusterContexts;
    for (let i = 0; i < clusterContexts.length; i++) {
        const context = clusterContexts[i];
        try {
            await createDashboard(context)
        }
        catch (e){
            console.error("Error creating dashboard. Reason:", e);
        }
    }
}

async function createDashboard(clusterContext) {
    const clusterVersion = Configuration.orchestration.kubernetesVersion;
    const client = new Client({config: config.fromKubeconfig(null, clusterContext), version: clusterVersion});
    try {
        await createManifests(client)
    }
    catch (e) {
        console.error("Unable to create manifests. Reason: ", e);
    }
}

async function createManifests(client) {
    const manifests = dashboardManifests(client);
    try {
        for (let i = 0; i < manifests.length; i++) {
            const manifest = manifests[i];
            await createManifest(manifest);
        }
    }
    catch (e) {
        console.error("Unable to create manifests. Reason: ", e);
    }
}


async function createManifest(manifest) {
    try {
        const resourcePath = Path.resolve(__dirname,Path.join('..','..', 'resources', 'application','dashboard'));
        const filePath = Path.join(resourcePath, manifest.name);
        const deploymentManifest = Fs.readJsonSync(filePath);
        await manifest.apiGroup.post({body: deploymentManifest})
    }
    catch(e){
        console.error("Unable to create manifest:", manifest.name, ". Reason:", e);
    }
}

function dashboardManifests(client) {
    const namespace = 'kube-system';
    return [
        {
            name: 'dashboard-secret.json',
            apiGroup: client.apis.v1.namespaces(namespace).secrets
        },
        {
            name: 'dashboard-serviceaccount.json',
            apiGroup: client.apis.v1.namespaces(namespace).serviceaccounts
        },
        {
            name: 'dashboard-role.json',
            apiGroup: client.apis["rbac.authorization.k8s.io"].v1.namespaces(namespace).roles
        },
        {
            name: 'dashboard-rolebinding.json',
            apiGroup: client.apis["rbac.authorization.k8s.io"].v1.namespaces(namespace).rolebindings
        },
        {
            name: 'dashboard-deployment.json',
            apiGroup: client.apis.apps.v1beta2.namespaces(namespace).deployments
        },
        {
            name: 'dashboard-service.json',
            apiGroup: client.apis.v1.namespaces(namespace).services
        }
    ];

}