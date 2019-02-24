const Path = require('path');

// Infrastructure
const googleCloudDirectory = Path.join("C:", "Users", "rober", "AppData", "Roaming", "gcloud");
const kubernetesConfigurationDirectory = Path.join("C:", "Users", "rober", ".kube");
const bucketName = "gs://graduate-project-kubernetes-clusters";
const sshDirectory = Path.join("C:", "Users", "rober", ".ssh");

function createAll(pairs) {
     pairs = pairs || [
        // {peers: 4, partitions: [4]},
        // {peers: 16, partitions: [2]}
        {peers: 16, partitions: [2]}
    ];

    const configurations = {
        control: [],
        treatment: []
    };

    experimentsSettingsForPairs(pairs).forEach(experimentSettings => {
        if (experimentSettings.type === "control") {
            configurations.control.push(controlConfiguration(experimentSettings));
        }
        else {
            configurations.treatment.push(treatmentConfiguration(experimentSettings));
        }
    });
    return configurations;
}

function experimentsSettingsForPairs(pairs) {
    const experimentSettings = [];
    const controlExternalIpAddress = "35.195.161.184";
    const treatmentExternalIpAddress = "35.233.6.119";

    const leafExternalIpAddresses = ["35.195.162.215", "104.199.90.23", "104.199.11.7", "35.241.246.164", "35.233.36.110", "35.195.44.226", "146.148.112.253", "35.205.66.14"];
    pairs.forEach(pair => {
        pair.partitions.forEach(amountOfPartitions => {
            experimentSettings.push({
                path: Path.resolve("..", "resources", "comparison", pair.peers + "-peers", amountOfPartitions + "-partitions"),
                type: "control",
                options: {
                    testRunnerExternalIpAddress: controlExternalIpAddress,
                    amountOfPeerGroups: amountOfPartitions
                }
            });
            experimentSettings.push({
                path: Path.resolve("..", "resources", "comparison", pair.peers + "-peers", amountOfPartitions + "-partitions"),
                type: "treatment",
                options: {
                    testRunnerExternalIpAddress: treatmentExternalIpAddress,
                    leafClusterExternalIpAddresses: leafExternalIpAddresses.slice(0, amountOfPartitions)
                }
            })
        })

    });
    return experimentSettings;
}

function treatmentConfiguration(experimentSettings) {
    const rootCluster = createRootCluster(experimentSettings.path, experimentSettings.options.testRunnerExternalIpAddress, experimentSettings.options.leafClusterExternalIpAddresses);
    const clusters = createClusters(experimentSettings.path, experimentSettings.options.leafClusterExternalIpAddresses, rootCluster);
    return {
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
            kubernetesConfigurationDirectory: kubernetesConfigurationDirectory,
            sshDirectory: sshDirectory
        }
    };
}

function createClusters(experimentPath, leafClusterExternalIpAddresses, rootCluster) {
    const clusters = createLeafClusterConfigurations(experimentPath, leafClusterExternalIpAddresses, rootCluster);
    clusters.push(rootCluster);
    return clusters;
}

function createLeafClusterConfigurations(experimentPath, externalIpAddresses, rootCluster) {
    const experimentConfigurationsPath = Path.join(experimentPath, 'configurations');
    const applicationPath = Path.join(experimentConfigurationsPath, 'application', 'tree');
    const orchestrationPath = Path.join(experimentConfigurationsPath, 'orchestration', 'tree');
    const infrastructurePath = Path.join(experimentConfigurationsPath, 'infrastructure', 'tree');
    const resultsPath = Path.join(experimentPath, 'results', 'tree');
    return externalIpAddresses.map((ipAddress, index) => {
        const leafName = "leaf-" + (index + 1);
        return {
            name: leafName,
            application: {
                fabricConfigurationPath: Path.join(applicationPath, 'leafs'),
                testRunnerConfigurationPath: Path.join(applicationPath, 'leafs', 'caliper'),
                testRunnerExternalIpAddress: ipAddress,
                parentTestRunnerIp: rootCluster.application.testRunnerExternalIpAddress
            },
            orchestration: {
                path: orchestrationPath,
                context: leafName + ".k8s.local"
            },
            infrastructure: {
                path: Path.join(infrastructurePath, leafName)
            },
            results: {
                path: Path.join(resultsPath, leafName)
            }
        }
    })
}

function createRootCluster(experimentPath, externalIpAddress, childrenIpAddresses) {
    const experimentConfigurationsPath = Path.join(experimentPath, 'configurations');
    const applicationPath = Path.join(experimentConfigurationsPath, 'application', 'tree');
    const orchestrationPath = Path.join(experimentConfigurationsPath, 'orchestration', 'tree');
    const infrastructurePath = Path.join(experimentConfigurationsPath, 'infrastructure', 'tree');
    const resultsPath = Path.join(experimentPath, 'results', 'tree');
    const clusterName = "root";
    return {
        name: clusterName,
        application: {
            fabricConfigurationPath: Path.join(applicationPath, clusterName),
            testRunnerConfigurationPath: Path.join(applicationPath, clusterName, 'test-runner'),
            testRunnerExternalIpAddress: externalIpAddress,
            childrenIpAddresses: childrenIpAddresses
        },
        orchestration: {
            path: orchestrationPath,
            context: "root.k8s.local"
        },
        infrastructure: {
            path: Path.join(infrastructurePath, clusterName)
        },
        results: {
            path: Path.join(resultsPath, clusterName)
        }
    };
}

function controlConfiguration(experimentSettings) {
    const cluster = singleCluster(experimentSettings);
    const clusters = [cluster];
    return {
        clusters: clusters,
        application: {
            rootTestRunnerExternalIpAddress: cluster.application.testRunnerExternalIpAddress,
            allExternalIpAddresses: clusters.map((cluster) => {
                return cluster.application.testRunnerExternalIpAddress
            }),

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
            kubernetesConfigurationDirectory: kubernetesConfigurationDirectory,
            sshDirectory: sshDirectory,
        }
    };
}

function singleCluster(experimentSettings) {
    const experimentConfigurationsPath = Path.join(experimentSettings.path, 'configurations');
    const applicationPath = Path.join(experimentConfigurationsPath, 'application');
    const orchestrationPath = Path.join(experimentConfigurationsPath, 'orchestration');
    const infrastructurePath = Path.join(experimentConfigurationsPath, 'infrastructure');
    const resultsPath = Path.join(experimentSettings.path, 'results');
    const clusterName = "singular";
    return {
        name: clusterName,
        application: {
            fabricConfigurationPath: Path.join(applicationPath, clusterName),
            testRunnerConfigurationPath: Path.join(applicationPath, clusterName, "caliper"),
            testRunnerExternalIpAddress: experimentSettings.options.testRunnerExternalIpAddress,
            amountOfPeerGroups: experimentSettings.options.amountOfPeerGroups.toString()
        },
        orchestration: {
            path: orchestrationPath,
            context: "singular.k8s.local"
        },
        infrastructure: {
            path: Path.join(infrastructurePath, clusterName)
        },
        results: {
            path: Path.join(resultsPath, clusterName)
        }
    };
}

module.exports = {createAll};