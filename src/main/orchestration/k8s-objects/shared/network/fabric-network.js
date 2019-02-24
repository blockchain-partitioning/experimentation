"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const naming_1 = require("kubechain/src/main/lib/kubernetes-sdk/utilities/naming");
class FabricNetwork {
    constructor(representation, cryptographicMaterialBasePath) {
        this.cryptographicMaterialBasePath = cryptographicMaterialBasePath;
        this.network = {};
        this.absolutePaths = [];
        this.relativePaths = [];
        this.network = this.createOrdererOrganizations(representation.orderers, this.network);
        this.network = this.createPeerOrganizations(representation.peers, this.network);
    }
    createOrdererOrganizations(organizations, network) {
        organizations.forEach((organization) => {
            if (organization.entities && organization.entities.length > 0) {
                network.orderer = this.ordererOptions(organization);
            }
        });
        return network;
    }
    ordererOptions(organization) {
        const orderer = organization.entities[0];
        this.absolutePaths.push(orderer.tls.path);
        this.relativePaths.push(Path.join(organization.domain, "orderers", orderer.name, "tls"));
        const hostName = this.entityHostName(organization, orderer);
        return {
            url: `grpc://${hostName}:7050`,
            mspid: organization.mspId,
            user: this.adminUser(organization),
            "server-hostname": hostName,
            tls_cacerts: Path.posix.join(this.cryptographicMaterialBasePath, organization.domain, "orderers", orderer.name, "tls", "ca.crt")
        };
    }
    adminUser(organizationRepresentation) {
        for (let i = 0; i < organizationRepresentation.users.length; i++) {
            const user = organizationRepresentation.users[i];
            if (user.type === "admin") {
                const keystore = "keystore";
                const signcerts = "signcerts";
                this.absolutePaths.push(Path.join(user.membershipServiceProvider.path, keystore));
                this.absolutePaths.push(Path.join(user.membershipServiceProvider.path, signcerts));
                this.relativePaths.push(Path.join(organizationRepresentation.domain, "users", user.name, "msp", keystore));
                this.relativePaths.push(Path.join(organizationRepresentation.domain, "users", user.name, "msp", signcerts));
                const mspDirectory = Path.posix.join(this.cryptographicMaterialBasePath, organizationRepresentation.domain, "users", user.name, "msp");
                return {
                    name: "Admin",
                    key: Path.posix.join(mspDirectory, keystore, Path.basename(user.membershipServiceProvider.filePaths.privateKey)),
                    cert: Path.posix.join(mspDirectory, signcerts, Path.basename(user.membershipServiceProvider.filePaths.signingCertificate))
                };
            }
        }
    }
    createPeerOrganizations(organizations, network) {
        organizations.forEach((representation) => {
            network[representation.name] = this.peerOrganizationOptions(representation);
        });
        return network;
    }
    peerOrganizationOptions(representation) {
        const caname = `ca.${representation.domain}`;
        const options = {
            name: representation.name,
            mspid: representation.mspId,
            ca: {
                url: `https://${caname}:7054`,
                name: caname
            },
            user: this.adminUser(representation)
        };
        representation.entities.forEach((peer) => {
            const peerId = peer.name.split('.')[0];
            options[peerId] = this.peerOptions(representation, peer);
        });
        return options;
    }
    peerOptions(organization, peer) {
        this.absolutePaths.push(peer.tls.path);
        this.relativePaths.push(Path.join(organization.domain, "peers", peer.name, "tls"));
        const hostName = this.entityHostName(organization, peer);
        return {
            requests: `grpc://${hostName}:7051`,
            events: `grpc://${hostName}:7053`,
            "server-hostname": hostName,
            tls_cacerts: Path.posix.join(this.cryptographicMaterialBasePath, organization.domain, "peers", peer.name, "tls", "ca.crt")
        };
    }
    entityHostName(organization, entity) {
        return `${naming_1.toDNS1123(entity.name).split("-")[0]}.${organization.domain}`;
    }
    getCryptographicMaterialAbsolutePaths() {
        return this.absolutePaths;
    }
    getCryptographicMaterialSearchPaths() {
        return this.relativePaths;
    }
    toJson() {
        return this.network;
    }
}
exports.default = FabricNetwork;
//# sourceMappingURL=fabric-network.js.map