const Path = require('path');
const Fs = require('fs-extra');
const Kubechain = require('kubechain/src/main/lib/kubechain/kubechain').default;
const FabricConfigurationCreator = require("kubechain/src/main/lib/blockchains/fabric/blockchain/configuration/create").default;
const FabricK8sAdapter = require("kubechain/src/main/lib/blockchains/fabric/adapters/gce/adapter").default;
const RequiredPeerAntiAffinity = require("./k8s-objects/shared/affinity/requiredpeerantiaffinity").default;
const CaliperConfiguration = require("./caliper-configuration");
const caliperConfig = CaliperConfiguration(Path.posix.join(Path.posix.sep, "caliper"));
const testRunnerConfig = CaliperConfiguration(Path.posix.join(Path.posix.sep, "test-runner"));

const SingularManifestCreator = require("./k8s-objects/singular/calipermapper").default;
const LeafManifestCreator = require("./k8s-objects/tree/leaf/calipermapper").default;
const RootManifestCreator = require("./k8s-objects/tree/root/resourcecreator").default;

const temporaryDirectory = Path.resolve(__dirname, 'resources', 'temp');

(async () => {
    const cluster = JSON.parse(process.argv[2]);
    await createK8sObjectsForCluster(cluster);
})();

async function createK8sObjectsForCluster(cluster) {
    Fs.removeSync(temporaryDirectory);
    Fs.removeSync(Path.join(cluster.orchestration.path, cluster.name));
    const kubechain = createKubechain(cluster);
    const configurationCreator = new FabricConfigurationCreator();
    await configurationCreator.create(kubechain);
    const adapter = new FabricK8sAdapter(kubechain);
    await adapter.start()

}

function createKubechain(cluster) {
    if (cluster.application.parentTestRunnerIp) {
        console.log("Creating leaf:", cluster.name, cluster.application.fabricConfigurationPath);
        return createKubechainForLeafCluster(cluster);
    }
    else if (cluster.application.childrenIpAddresses) {
        console.log("Creating root:", cluster.name);
        return createKubechainForRootCluster(cluster);
    }
    else {
        console.log("Creating singular:", cluster.name, cluster.orchestration.context);
        return createKubechainForSingularCluster(cluster);
    }
}

function createKubechainForLeafCluster(cluster) {
    const callbackFunction = (async (data) => {
        try {
            let caliperMapper = new LeafManifestCreator(data.options);
            await caliperMapper.start({
                    representation: data,
                    chaincodes: caliperConfig.chaincodes,
                    channels: caliperConfig.channels,
                    endorsementPolicy: caliperConfig.endorsementPolicy,
                    context: caliperConfig.context
                },
                cluster.application.testRunnerExternalIpAddress,
                cluster.application.parentTestRunnerIp,
                cluster.application.testRunnerConfigurationPath);
            caliperMapper.write();
        } catch (e) {
            console.warn("Error", e);
        }
    });

    return createKubechainForCluster(cluster, callbackFunction);
}

function createKubechainForRootCluster(cluster) {
    const callbackFunction = (async (data) => {
        try {
            let creator = new RootManifestCreator(data.options);
            await creator.start({
                    representation: data,
                    chaincodes: testRunnerConfig.chaincodes,
                    channels: testRunnerConfig.channels,
                    endorsementPolicy: testRunnerConfig.endorsementPolicy,
                    context: testRunnerConfig.context
                }, {
                    childrenIPAddresses: cluster.application.childrenIpAddresses,
                    loadBalancerIP: cluster.application.testRunnerExternalIpAddress,
                    transactionsPerSecond: undefined,
                },
                cluster.application.testRunnerConfigurationPath);
            creator.write();
        } catch (e) {
            console.warn("Error", e);
        }
    });
    return createKubechainForCluster(cluster, callbackFunction);
}

function createKubechainForSingularCluster(cluster) {
    const callbackFunction = (async (data) => {
        try {
            let caliperMapper = new SingularManifestCreator(data.options);
            await caliperMapper.start({
                    representation: data,
                    chaincodes: caliperConfig.chaincodes,
                    channels: caliperConfig.channels,
                    endorsementPolicy: caliperConfig.endorsementPolicy,
                    context: caliperConfig.context
                },
                cluster.application.testRunnerExternalIpAddress,
                cluster.application.testRunnerConfigurationPath,
                cluster.application.amountOfPeerGroups);
            caliperMapper.write();
        } catch (e) {
            console.warn("Error", e);
        }
    });
    return createKubechainForCluster(cluster, callbackFunction);
}

function createKubechainForCluster(cluster, callbackFunction) {
    const options = {
        name: cluster.name,
        targets: {
            blockchain: "fabric",
            kubernetes: "gce"
        },
        kubernetes: {
            context: cluster.orchestration.context
        },
        paths: {
            root: temporaryDirectory,
            blockchains: Path.join(temporaryDirectory, "blockchains"),
            configuration: cluster.application.fabricConfigurationPath,
            kubernetes: cluster.orchestration.path
        },
        adapter: {
            version: "1.2.0",
            tags: {
                ca: "x86_64-1.0.6"
            },
            affinity: {
                orderer: new RequiredPeerAntiAffinity(), // Requires nodes where: No peer-pods are present & is not a member of the loadgenerator instance group
                peer: new RequiredPeerAntiAffinity() // Requires nodes where: No peer-pods are present & is not a member of the loadgenerator instance group
            },
            hooks: {
                createdRepresentations(data) {
                    callbackFunction(data);
                },
                creatingOrganization() {
                },
                createdCryptographicMaterial() {
                },
                createdChannels(data) {

                },
                beforeWrite(data) {
                },
                written(data) {
                },
                workload: {
                    created(data) {
                    },

                    createdConfiguration(data) {
                    },

                    beforeCreate(data) {
                    },

                    beforeWrite(data) {
                    }
                }
            },
            options: {
                chaincodes: [{id: "simple-addition-chaincode"}],
                channels: [
                    {
                        name: "kubechain",
                        profile: "Channel",
                        organizations: ["Org1"]
                    }
                ],
                profile: "OrdererGenesis"
            }
        }
    };
    const kubechain = new Kubechain(undefined);
    kubechain.setOptions(options);
    return kubechain;
}