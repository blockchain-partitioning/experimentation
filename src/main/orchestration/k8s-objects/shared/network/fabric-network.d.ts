import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import OrganizationRepresentation from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/representation/organizations/representation";
import OrganizationEntityRepresentation from "kubechain/src/main/lib/blockchains/fabric/utilities/blockchain/representation/organizations/entities/representation";
export default class FabricNetwork implements IResource {
    private absolutePaths;
    private relativePaths;
    private network;
    private cryptographicMaterialBasePath;
    constructor(representation: {
        peers: OrganizationRepresentation[];
        orderers: OrganizationRepresentation[];
    }, cryptographicMaterialBasePath: string);
    createOrdererOrganizations(organizations: OrganizationRepresentation[], network: any): any;
    ordererOptions(organization: OrganizationRepresentation): {
        url: string;
        mspid: string;
        user: {
            name: string;
            key: string;
            cert: string;
        };
        "server-hostname": string;
        tls_cacerts: string;
    };
    adminUser(organizationRepresentation: OrganizationRepresentation): {
        name: string;
        key: string;
        cert: string;
    };
    createPeerOrganizations(organizations: OrganizationRepresentation[], network: any): any;
    peerOrganizationOptions(representation: OrganizationRepresentation): any;
    peerOptions(organization: OrganizationRepresentation, peer: OrganizationEntityRepresentation): {
        requests: string;
        events: string;
        "server-hostname": string;
        tls_cacerts: string;
    };
    entityHostName(organization: OrganizationRepresentation, entity: OrganizationEntityRepresentation): string;
    getCryptographicMaterialAbsolutePaths(): string[];
    getCryptographicMaterialSearchPaths(): string[];
    toJson(): any;
}
