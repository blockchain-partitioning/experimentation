"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const daemonset_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/daemonset/daemonset");
const directoryorcreate_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/hostpath/directoryorcreate");
const Path = require("path");
const container_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container");
const envvar_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar");
const port_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port");
const securitycontext_1 = require("kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/securitycontext");
class DockerDaemonset {
    constructor() {
        this.createVolume();
        this.createContainer();
        this.createWorkload();
    }
    createVolume() {
        this.runHostPathVolume = new directoryorcreate_1.default('run');
        this.runHostPathVolume.setHostPath(Path.posix.join(Path.posix.sep, 'var', 'run'));
    }
    createContainer() {
        this.dockerContainer = new container_1.default("socat", "alpine/socat");
        this.dockerContainer.addVolumeMount(this.runHostPathVolume.toVolumeMount(Path.posix.join(Path.posix.sep, 'var', 'run', Path.posix.sep)));
        const port = new port_1.default("http", 2375);
        port.setHostPort(2375);
        this.dockerContainer.addPort(port);
        this.dockerContainer.addEnvironmentVariable(new envvar_1.default("DOCKER_HOST", "tcp://0.0.0.0:2375"));
        this.dockerContainer.addArgument("-v");
        this.dockerContainer.addArgument("TCP4-LISTEN:2375,fork,reuseaddr");
        this.dockerContainer.addArgument("UNIX-CONNECT:/var/run/docker.sock");
        const context = new securitycontext_1.default();
        context.setPrivileged(true);
        this.dockerContainer.setSecurityContext(context);
    }
    createWorkload() {
        this.daemonSet = new daemonset_1.default("http-docker-access", "kube-system");
        this.daemonSet.addLabel("k8s-app", "http-docker-access");
        this.daemonSet.addMatchLabel("name", "http-docker-access");
        this.daemonSet.addContainer(this.dockerContainer);
        this.daemonSet.addVolume(this.runHostPathVolume);
    }
    toJson() {
        return this.daemonSet.toJson();
    }
}
exports.default = DockerDaemonset;
//# sourceMappingURL=docker-daemonset.js.map