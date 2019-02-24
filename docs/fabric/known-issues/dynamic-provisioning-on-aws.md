# Dynamic provisioning on AWS

## Problem

- **Description**: Unable to use dynamic provisioning.
- **Cause:** See [KUBE-45726](https://github.com/kubernetes/kubernetes/issues/45726).

## Solutions
Possible solutions to the problem.

### Different versions
#### Reasoning
1. Whilst searching for a solution there were a few comments suggesting that this issue did not exist in version 1.7.0
1. AWS made Kubernetes a first-class citizen with  the introduction of [EKS](https://aws.amazon.com/eks/) which could mean the issue was resolved in later versions (1.9^).

#### Caveats
Some versions might not have the same functionality available as the Kubernetes in-use version (1.8.0).

#### Attempts
- **Attempt**: Tried version 1.7.0
- **Outcome**: Issue persists.


- **Attempt**: Tried version 1.8.0
- **Outcome**: Issue persists.


- **Attempt**: Tried version 1.9.2
- **Outcome**: Issue persists.

### Use EFS as Persistent Volume (PV)
#### Reasoning
Whilst searching for a solution there was a comment that suggested using EFS resolved the issue for that particular user.
#### Caveats
- ~~**Caveat**: 1-on-1 EFS-Organization~~
- ~~**Explanation**: For Hyperledger Fabric setups with more than 1 organization more than 1 EFS volume would have to be created. Sharing a volume creates the possibility that organizations can access certificates they are not supposed access.~~
- **INCORRECT**: The efs-provisioner creates sub-directories per PVC. This means organizations will never see each-others data, unless they use the same PVC. Which should never happen.


- ~~**Caveat**: Provisioning is arduous.~~
- ~~**Explanation**: User has to manually create the needed EFS volumes and feed them to Kubechain.~~
- **INCORRECT**:  The efs-provisioner creates sub-directories per PVC.


- **Caveat**: Undetermined throughput speeds.
- **Explanation**: Unknown what the exact throughput is for data stored on a EFS volume. This is important for the experiment because the throughput should be an independent variable.


- **Caveat**: Costs.
- **Explanation**: Costs for running an EFS volume might be higher than an EBS volume.

#### Attempts

- **Attempt**: 
- **Outcome**:


### Manual creation of volumes

#### Reasoning
This would circumvent attaching and detaching volumes the scheduler is attempting to do.

#### Caveats
- **Caveat**: Provisioning is arduous.
- **Explanation**: User has to manually create the needed volumes and feed them to Kubechain.

#### Attempts

- **Attempt**: 
- **Outcome**:


### Use GFS provisioner
#### Reasoning
- Using the GFS provisioner would circumvent aws provisioning entirely (hyperconvergent, aka container attached storage).
- Using CAS would use the underlying EBS volumes attached to a node.

#### Caveats
- **Caveat**: Seems like a difficult setup.
- **Explanation**: ...

#### Attempts

- **Attempt**: GlusterFS+Heketi
- **Outcome**:


### Use OpenEBS provisioner
#### Reasoning
- Using the OpenEBS provisioner would circumvent aws provisioning entirely (hyperconvergent, aka container attached storage).
- Using CAS would use the underlying EBS volumes attached to a node.

#### Caveats
- **Caveat**: This might break Burrow when using Hostpaths. 
- **Explanation**: See [the levelDB issue](/known-issues/level-db-hostpath-volumes.md).

#### See
- [https://github.com/openebs/openebs/tree/master/k8s](https://github.com/openebs/openebs/tree/master/k8s)
- [https://docs.openebs.io/docs/gsoverview.html](https://docs.openebs.io/docs/gsoverview.html)

#### Attempts

- **Attempt**: N/A
- **Outcome**: 


### Use Burrow Helm charts
#### Reasoning
The charts are maintained by Burrow developers and could possibly provide an alternative to Kubechain adapters.

#### Caveats
- **Caveat**: Lack of control
- **Explanation**: Charts are not maintained by me and requesting a change my take a while to be implemented.

#### Attempts

- **Attempt**: Attempted to deploy helm charts with [helm.js](/known-issues/resources/helm.js).
- **Outcome**: Deployment succeeded however, EBS volumes were only created once even-though there were 3 validators.

#### See
- [https://hub.kubeapps.com/charts/stable/burrow/0.4.2](https://hub.kubeapps.com/charts/stable/burrow/0.4.2)

### Switch to GCE
#### Reasoning
AWS is turning out to be full of problems concerning dynamic provisioning.

#### Caveats
- **Caveat**: ...
- **Explanation**: ...

#### Attempts

- **Attempt**: Switched to GCE.
- **Outcome**: Kubernetes is operating correctly.