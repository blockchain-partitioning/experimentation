"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const namespace_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/cluster/namespace");
class TestRunnerNamespace {
    constructor() {
        this.namespace = new namespace_1.default("test-runner");
    }
    toJson() {
        return this.namespace.toJson();
    }
}
exports.default = TestRunnerNamespace;
//# sourceMappingURL=test-runner.js.map