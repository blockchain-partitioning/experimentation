const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..', 'resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');


async function continueVariants(configurations, amountOfSamples) {
    for (let i = 0; i < configurations.length; i++) {
        const variant = new Variant(configurations[i]);
        try {
            await continueVariant(variant, amountOfSamples);
        }
        catch (e) {
            console.log("Failed to run experiments. Reason:", e);
            break;
        }
    }
}

async function continueVariant(variant, amountOfSamples) {
    await preamble(variant);
    await variant.takeSamples(amountOfSamples);
    await postamble(variant);
}

async function preamble(variant) {
    console.log("Starting preamble...");
    await continueRunningSample(variant);
    await variant.deleteNetworks();
    console.log("Finished preamble");
}

async function continueRunningSample(variant) {
    try {
        await variant.continueExperiments();//TODO: This will fail for anything where the variants independent variables are changed.
        variant.clear();
        await variant.stopExperiments();
    }
    catch (e) {
        console.error("Error running experiment:", e);
        console.log("Retrying...");
        await variant.deleteNetworks();
        await variant.deployNetworks();
        await variant.takeSample();
    }
}

async function postamble(variant) {
    console.log("Waiting for K8s to remove load-balancers...");
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            await variant.deleteClusters();
            console.log("Finished cleaning up clusters");
            resolve();
        }, 30000);
    })
}

(async () => {
    const configurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variants = Configuration.get('run.variants');
    const amountOfSamples = 7;
    const promises = variants.map((variant) => {
        if (configurations.hasOwnProperty(variant)) {
            return continueVariants(configurations[variant], amountOfSamples);
        }
        else {
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
})();