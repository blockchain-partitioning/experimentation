# Creation using Kops

## Usage
1. Copy the files in this directory to the parent-directory of the directory containing the cluster-files
1. Change the `config.js` file if necessary, 
1. Afterwards run the files using NodeJS.

## Example
Say you'd like to run a rooted-tree setup with 2 leaf-clusters and each cluster has 2-nodes.

1. Copy all the files in this directory over to `../tree/2-leafs-2-nodes/`
1. Run: `cd ../tree/2-leafs-2-nodes/`
1. Change the configuration in ``config.js``
  - Change ``googleCloudDirectory`` to your google cloud directory path.
  - Change ``bucketName`` to your google cloud bucket.
  - Change ``clusterNames`` to `[{context:"root", directory: "root"}, {context:"leaf-1", directory: "leaf-1"},{context:"leaf-2", directory: "leaf-2"}];`
1. Create the clusters.
  - Run: ``node create.js``
1. Deploy the clusters.
  - Run: ``node deploy.js``
1. Delete the clusters when you're done.
  - Run: ``node delete.js``