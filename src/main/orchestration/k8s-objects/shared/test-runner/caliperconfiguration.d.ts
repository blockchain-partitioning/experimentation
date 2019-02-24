import OrganizationRepresentation from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/representation/organizations/representation";
export default interface CaliperConfiguration {
    representation: {
        peers: OrganizationRepresentation[];
        orderers: OrganizationRepresentation[];
    };
    chaincodes: any[];
    channels: any[];
    endorsementPolicy: any;
    context: any;
}
