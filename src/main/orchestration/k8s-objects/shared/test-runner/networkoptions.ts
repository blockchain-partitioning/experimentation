import FabricNetwork from "../network/fabric-network";
import CaliperConfiguration from "./caliperconfiguration";

//TODO: Remove duplicate class
export default class NetworkOptions {
    private options: { fabric: { cryptodir: string; network: any; channel: any[]; chaincodes: any[]; "endorsement-policy": any; context: any } };
    private network: FabricNetwork;

    create(caliperConfiguration: CaliperConfiguration, cryptoDir: string) {
        this.network = new FabricNetwork(caliperConfiguration.representation, cryptoDir);
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

    toString(): string {
        return JSON.stringify(this.options);
    }
}