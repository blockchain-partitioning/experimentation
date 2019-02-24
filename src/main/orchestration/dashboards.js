const Path = require('path');
const Fs = require('fs-extra');
const Open = require('opn');
const Client = require('kubernetes-client').Client;
const KubernetesConfig = require('kubernetes-client').config;

class Dashboards {
    constructor(configuration) {
        this.configuration = configuration;
    }

    async deployAll() {
        console.log("Deploying dashboards...");
        const clusterContexts = this.configuration.orchestration.clusterContexts;
        for (let i = 0; i < clusterContexts.length; i++) {
            const context = clusterContexts[i];
            try {
                await this.deployDashboard(context)
            }
            catch (e) {
                console.error("Error creating dashboard. Reason:", e);
            }
        }
        console.log("Deployed dashboards.");
    }

    async deployDashboard(clusterContext) {
        const clusterVersion = this.configuration.orchestration.kubernetesVersion;
        const client = new Client({
            config: KubernetesConfig.fromKubeconfig(null, clusterContext),
            version: clusterVersion
        });
        try {
            await this.createK8sObjects(client)
        }
        catch (e) {
            console.error("Unable to create manifests. Reason: ", e);
        }
    }

    async createK8sObjects(client) {
        const k8sObjects = this.dashboardK8sObjects(client);
        try {
            for (let i = 0; i < k8sObjects.length; i++) {
                const k8sObject = k8sObjects[i];
                await this.createK8sObject(k8sObject);
            }
        }
        catch (e) {
            console.error("Unable to create manifests. Reason: ", e);
        }
    }


    async createK8sObject(k8sObject) {
        try {
            const resourcePath = Path.resolve(__dirname, Path.join('..', '..', 'resources', 'application', 'dashboard'));
            const filePath = Path.join(resourcePath, k8sObject.name);
            const deploymentManifest = Fs.readJsonSync(filePath);
            await k8sObject.apiGroup.post({body: deploymentManifest})
        }
        catch (e) {
            console.error("Unable to create manifest:", k8sObject.name, ". Reason:", e);
        }
    }

    dashboardK8sObjects(client) {
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

    async openAll() {
        const clusterContexts = this.configuration.orchestration.clusterContexts;
        for (let i = 0; i < clusterContexts.length; i++) {
            const context = clusterContexts[i];
            try {
                await this.openDashboard(context)
            }
            catch (e) {
                console.error("Cannot open dashboard. Reason:", e);
            }
        }
    }

    async openDashboard(clusterContext) {
        console.log("Opening:", clusterContext);
        const contextConfig = KubernetesConfig.fromKubeconfig(null, clusterContext);
        this.showCredentials(contextConfig.auth);
        await Open(contextConfig.url + '/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default')
    }

    showCredentials(auth) {
        console.log("You should login with:");
        console.log(auth.user + "\t");
        console.log(auth.pass);
    }
}


module.exports = Dashboards;