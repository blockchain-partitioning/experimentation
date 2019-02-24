const Clusters = require('./infrastructure/clusters');
const Configurations = require('./variant-configurations');

async function validateExperiments(configurations) {
    for (let i = 0; i < configurations.length; i++) {
        const configuration = configurations[i];
        try {
            const clusters = new Clusters(configuration);
            await clusters.validateAll()
        }
        catch (e) {
            console.log("Failed to delete experiments. Reason:", e);
            break;
        }
    }
}

(async () => {
    const configurations = Configurations.createAll();
    console.log(configurations.control.length, configurations.treatment.length);
    // deleteExperiments(configurations.control),
    await Promise.all(validateExperiments(configurations.treatment));
})();