const Path = require('path');

// Experiment
const peers = '4-peers';
const partitions = '2-partitions';
const experimentPath = Path.resolve(__dirname, Path.join('..', 'resources', 'comparison', peers, partitions));
const experimentConfigurationsPath = Path.join(experimentPath, 'configurations');

// Application
const experimentApplicationPath = Path.join(experimentConfigurationsPath, 'application', 'tree');
const rootClusterExternalIpAddress = "35.233.6.119";
const leafClusterExternalIpAddresses = ["35.195.162.215", "104.199.90.23"]; // Make sure this is sorted like so: leaf-1 is on index 0, leaf-2 is on index: 1 etc..
// Orchestration
const experimentOrchestrationPath = Path.join(experimentConfigurationsPath, 'orchestration', 'tree');

// Infrastructure
const googleCloudDirectory = Path.join("C:", "Users", "rober", "AppData", "Roaming", "gcloud");
const kubernetesConfigurationDirectory = Path.join("C:", "Users", "rober", ".kube");
const bucketName = "gs://graduate-project-kubernetes-clusters";
const experimentInfrastructurePath = Path.join(experimentConfigurationsPath, 'infrastructure', 'tree');

// Results
const resultsPath = Path.join(experimentPath, 'results', 'tree');

const rootCluster = createRootCluster(rootClusterExternalIpAddress, leafClusterExternalIpAddresses);
const clusters = createClusters(leafClusterExternalIpAddresses, rootCluster);

function createClusters() {
    const clusters = createLeafClusterConfigurations(leafClusterExternalIpAddresses, rootCluster);
    clusters.push(rootCluster);
    return clusters;
}

function createRootCluster(externalIpAddress, childrenIpAddresses) {
    const rootName = "root";
    return {
        name: rootName,
        application: {
            fabricConfigurationPath: Path.join(experimentApplicationPath, rootName),
            testRunnerConfigurationPath: Path.join(experimentApplicationPath, 'root', 'test-runner'),
            testRunnerExternalIpAddress: externalIpAddress,
            childrenIpAddresses: childrenIpAddresses
        },
        orchestration: {
            path: experimentOrchestrationPath,
            context: "root.k8s.local"
        },
        infrastructure: {
            path: Path.join(experimentInfrastructurePath, rootName)
        },
        results: {
            path: Path.join(resultsPath, rootName)
        }
    };
}

function createLeafClusterConfigurations(externalIpAddresses, rootCluster) {
    return externalIpAddresses.map((ipAddress, index) => {
        const leafName = "leaf-" + (index + 1);
        return {
            name: leafName,
            application: {
                fabricConfigurationPath: Path.join(experimentApplicationPath, 'leafs'),
                testRunnerConfigurationPath: Path.join(experimentApplicationPath, 'leafs', 'caliper'),
                testRunnerExternalIpAddress: ipAddress,
                parentTestRunnerIp: rootCluster.application.testRunnerExternalIpAddress
            },
            orchestration: {
                path: experimentOrchestrationPath,
                context: leafName + ".k8s.local"
            },
            infrastructure: {
                path: Path.join(experimentInfrastructurePath, leafName)
            },
            results: {
                path: Path.join(resultsPath, leafName)
            }
        }
    })
}

module.exports = {
    clusters: clusters,
    application: {
        rootTestRunnerExternalIpAddress: rootCluster.application.testRunnerExternalIpAddress,
        allExternalIpAddresses: clusters.map((cluster) => {
            return cluster.application.testRunnerExternalIpAddress
        })
    },
    orchestration: {
        kubernetesVersion: '1.8',
        clusterContexts: clusters.map((cluster) => {
            return cluster.orchestration.context
        })
    },
    infrastructure: {
        googleCloudDirectory: googleCloudDirectory,
        bucketName: bucketName,
        kubernetesConfigurationDirectory: kubernetesConfigurationDirectory
    }
};
