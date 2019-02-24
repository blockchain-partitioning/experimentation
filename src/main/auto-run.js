const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..', 'resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

async function run() {
    const variantConfigurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variants = Configuration.get('run.variants');
    const promises = variants.map((variant) => {
        if (variantConfigurations.hasOwnProperty(variant)) {
            return runVariants(variantConfigurations[variant]);
        }
        else {
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
}

async function runVariants(variantConfigurations) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const variant = new Variant(variantConfigurations[i]);
        try {
            await runVariant(variant);
        }
        catch (e) {
            console.log("Failed to run experiments. Reason:", e);
            break;
        }
    }
}

async function runVariant(variant) {
    if (Configuration.get('executePreamble')) {
        await preamble(variant);
    }
    await variant.takeSamples(Configuration.get('amountOfSamples'));
    if (Configuration.get('executePostamble')) {
        await postamble(variant);
    }
}

async function preamble(variant) {
    console.log("Starting preamble...");
    await variant.createAndDeployClusters();
    await variant.deployDashboards();
    await variant.createK8sObjects();
    console.log("Finished preamble");
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
    await run();
})();