const Path = require('path');
process.env.NODE_ENV = "samples";
process.env.NODE_CONFIG_DIR = Path.resolve(__dirname, Path.join('..','resources', 'configuration'));
const Configuration = require("config");
const VariantConfigurations = require('./variant-configurations');
const Variant = require('./variant');

async function downloadDataDumps(variantConfigurations) {
    for (let i = 0; i < variantConfigurations.length; i++) {
        const configuration = variantConfigurations[i];
        const variant = new Variant(configuration);
        try {
            await variant.downloadDataDumps();
        }
        catch (e) {
            console.log("Failed to download dumps. Reason:", e);
            break;
        }
    }
}

(async () => {
    const configurations = VariantConfigurations.createAll(Configuration.get('run.for'));
    const variants = Configuration.get('run.variants');
    const promises = variants.map((variant)=>{
        if(configurations.hasOwnProperty(variant)){
            return downloadDataDumps(configurations[variant]);
        }
        else{
            return Promise.resolve();
        }
    });
    await Promise.all(promises);
})();
