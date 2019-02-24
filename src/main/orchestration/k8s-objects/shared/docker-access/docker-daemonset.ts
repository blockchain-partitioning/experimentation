import IResource from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/iresource";
import DaemonSet from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/daemonset/daemonset";
import DirectoryOrCreateHostPathVolume from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/configuration-storage/storage/volumes/hostpath/directoryorcreate";
import * as Path from "path";
import Container from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/container";
import EnvVar from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/envvar";
import ContainerPort from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/port";
import SecurityContext from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/securitycontext";
import IContainer from "kubechain/src/main/lib/kubernetes-sdk/api/1.8/workloads/container/icontainer";

export default class DockerDaemonset implements IResource {
    private daemonSet: DaemonSet;
    private runHostPathVolume: DirectoryOrCreateHostPathVolume;
    private dockerContainer: IContainer;

    constructor() {
        this.createVolume();
        this.createContainer();
        this.createWorkload();
    }

    private createVolume() {
        this.runHostPathVolume = new DirectoryOrCreateHostPathVolume('run');
        this.runHostPathVolume.setHostPath(Path.posix.join(Path.posix.sep, 'var', 'run'));
    }

    private createContainer() {
        this.dockerContainer = new Container("socat", "alpine/socat");
        this.dockerContainer.addVolumeMount(this.runHostPathVolume.toVolumeMount(Path.posix.join(Path.posix.sep, 'var', 'run', Path.posix.sep)));
        const port = new ContainerPort("http", 2375);
        port.setHostPort(2375);
        this.dockerContainer.addPort(port);
        this.dockerContainer.addEnvironmentVariable(new EnvVar("DOCKER_HOST", "tcp://0.0.0.0:2375"));
        this.dockerContainer.addArgument("-v");
        this.dockerContainer.addArgument("TCP4-LISTEN:2375,fork,reuseaddr");
        this.dockerContainer.addArgument("UNIX-CONNECT:/var/run/docker.sock");

        const context = new SecurityContext();
        context.setPrivileged(true);
        this.dockerContainer.setSecurityContext(context);
    }

    private createWorkload() {
        this.daemonSet = new DaemonSet("http-docker-access", "kube-system");
        this.daemonSet.addLabel("k8s-app", "http-docker-access");
        this.daemonSet.addMatchLabel("name", "http-docker-access");
        this.daemonSet.addContainer(this.dockerContainer);
        this.daemonSet.addVolume(this.runHostPathVolume);
    }

    toJson(): any {
        return this.daemonSet.toJson();
    }

}