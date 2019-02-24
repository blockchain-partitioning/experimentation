const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..','resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

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

async function deleteVariants(variantConfigurations) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const variant = new Variant(variantConfigurations[i]);
        try {
            await variant.deleteNetworks();
            if(Configuration.get("executePostamble")){
                await postamble(variant);
            }
        }
        catch (e) {
            console.log("Failed to delete experiments. Reason:", e);
            variant.clear();
            break;
        }
    }
}

(async () => {
    const variantConfigurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variants = Configuration.get('run.variants');
    const promises = variants.map((variant)=>{
        if(variantConfigurations.hasOwnProperty(variant)){
            return deleteVariants(variantConfigurations[variant]);
        }
        else{
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
})();