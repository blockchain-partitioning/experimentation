const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..', 'resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

async function retryVariants(variantConfigurations,amountOfSamples) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const variant = new Variant(variantConfigurations[i]);
        try {
            await retryVariant(variant, amountOfSamples);
        }
        catch (e) {
            console.log("Failed to run experiments. Reason:", e);
            break;
        }
    }
}

async function retryVariant(variant, amountOfSamples) {
    await preamble(variant); //TODO: This will fail for more than one set of independent variables
    await variant.takeSamples(amountOfSamples);
    if(Configuration.get("executePostamble")){
        await postamble(variant);
    }
}

async function preamble(variant) {
    try {
        await variant.deleteNetworks()
    }
    catch (e) {

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
    const variantConfigurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variantsTypes = Configuration.get('run.variants');
    const amountOfSamples = 6;
    const promises = variantsTypes.map((variantType) => {
        if (variantConfigurations.hasOwnProperty(variantType)) {
            return retryVariants(variantConfigurations[variantType],amountOfSamples);
        }
        else {
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
})();