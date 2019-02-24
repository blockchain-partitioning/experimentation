const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..', 'resources', 'configuration'));
const Configuration = require('config');
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

async function update() {
    const variantConfigurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variants = Configuration.get('run.variants');
    const promises = variants.map((variant) => {
        if (variantConfigurations.hasOwnProperty(variant)) {
            return generateK8sObjects(variantConfigurations[variant]);
        }
        else {
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
}

async function generateK8sObjects(variantConfigurations) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const configuration = variantConfigurations[i];
        const variant = new Variant(configuration);
        await variant.createK8sObjects()
    }
}

(async () => {
    await update()
})();