const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..', 'resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

(async () => {
    const variantConfigurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variantsTypes = Configuration.get('run.variants');
    const promises = variantsTypes.map((variantType) => {
        if (variantConfigurations.hasOwnProperty(variantType)) {
            return verifyVariantsAreFinished(variantConfigurations[variantType]);
        }
        else {
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
})();

async function verifyVariantsAreFinished(variantConfigurations) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const variant = new Variant(variantConfigurations[i]);
        try {
            await variant.isFinished();
        }
        catch (e) {
            console.log("Failed to delete experiments. Reason:", e);
            break;
        }
    }
}
