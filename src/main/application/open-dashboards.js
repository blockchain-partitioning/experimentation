const KubernetesConfig = require('kubernetes-client').config;
const Open = require('opn');
const Configuration = require('../config');

(async () => {
    await openDashboards();
})();

async function openDashboards() {
    const clusterContexts = Configuration.orchestration.clusterContexts;
    for (let i = 0; i < clusterContexts.length; i++) {
        const context = clusterContexts[i];
        try {
            await openDashboard(context)
        }
        catch (e) {
            console.error("Cannot open dashboard. Reason:", e);
        }
    }
}

function showCredentials(auth) {
    console.log("You should login with:");
    console.log(auth.user + "\t");
    console.log(auth.pass);
}

async function openDashboard(clusterContext) {
    console.log("Opening:", clusterContext);
    const contextConfig = KubernetesConfig.fromKubeconfig(null, clusterContext);
    showCredentials(contextConfig.auth);
    await Open(contextConfig.url + '/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default')
}
