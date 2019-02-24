const chaincodes = [{
    "id": "simple-addition-chaincode",
    "path": "simple-addition-chaincode", //GOPATH is set to /caliper/golang. Golang.js->package() looks in $GOPATH/src/<chaincodePath>, So the full path = /caliper/golang/src/simple //TODO Check this.
    "language": "golang",
    "version": "v0",
    "channel": "kubechain"
}];
const endorsementPolicy = {
    "identities": [
        {
            "role": {
                "name": "member",
                "mspId": "Org1"
            }
        }
    ],
    "policy": {
        '1-of': [
            {'signed-by': 0}
        ]
    }
};
const context = {
    "round-1": "kubechain",
    "round-2": "kubechain",
    "round-3": "kubechain",
    "round-4": "kubechain",
    "round-5": "kubechain",
    "round-6": "kubechain",
    "round-7": "kubechain",
    "round-8": "kubechain",
    "max-1": "kubechain",
    "max-2": "kubechain",
    "max-3": "kubechain",
    "max-4": "kubechain",
    "max-5": "kubechain"
};

module.exports = function (workingDirectory) {
    return {
        chaincodes: chaincodes,
        channels: [
            {
                "name": "kubechain",
                "config": workingDirectory + "/network/channels/kubechain/kubechain.tx",
                "organizations": ["Org1"]
            }
        ],
        endorsementPolicy: endorsementPolicy,
        context: context
    }
};