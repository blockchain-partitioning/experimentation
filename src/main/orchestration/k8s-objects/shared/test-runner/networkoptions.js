"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_network_1 = require("../network/fabric-network");
//TODO: Remove duplicate class
class NetworkOptions {
    create(caliperConfiguration, cryptoDir) {
        this.network = new fabric_network_1.default(caliperConfiguration.representation, cryptoDir);
        this.options = {
            fabric: {
                cryptodir: cryptoDir,
                network: this.network.toJson(),
                channel: caliperConfiguration.channels,
                chaincodes: caliperConfiguration.chaincodes,
                "endorsement-policy": caliperConfiguration.endorsementPolicy,
                context: caliperConfiguration.context
            }
        };
    }
    getCryptographicMaterialAbsolutePaths() {
        return this.network.getCryptographicMaterialAbsolutePaths();
    }
    getCryptographicMaterialSearchPaths() {
        return this.network.getCryptographicMaterialSearchPaths();
    }
    toString() {
        return JSON.stringify(this.options);
    }
}
exports.default = NetworkOptions;
//# sourceMappingURL=networkoptions.js.map