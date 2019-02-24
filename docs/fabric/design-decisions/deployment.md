# Deployment
Designing the experiment entailed several decisions on how to deploy permissioned blockchains in a reproducible manner.
Most of these decisions are listed below.

## Infrastructure
### Tooling
#### Available
- Kops
- Tectonic
- Rancher

##### Kops
Pro's:
- Free.
- Easily configurable.
- No limit on nodes.
- Reusable manifests.
- Can generate terraform resources.

Con's:
- Windows usage requires Docker.
- Only supports GCE and AWS.
- Infrastructure only.

##### Tectonic
Pro's:
- Support for all major cloud vendors. AWS, Azure, GCE
- Infrastructure and cluster management.

Con's:
- Limited to 10 nodes (Free Edition)

##### Rancher
Pro's:
- Support for all major cloud vendors. AWS, Azure, VSphere
- Infrastructure and cluster management.

Con's:
- Does not support Windows.

#### Chosen
- Kops

### Cloud

#### Available
- AWS
- Azure
- GCE
- VSphere
- ...

##### AWS
Pro's:
- Able to use prepaid credit-card.
Con's:
- Dynamically provisioned EBS volumes are broken see [this issue document](/known-issues/dynamic-provisioning-on-aws.md).

##### Azure
Pro's:
Con's:
- Not supported by Kops

##### GCE
Pro's:
Con's:
- Cannot use prepaid credit-card.

#### Chosen
- GCE