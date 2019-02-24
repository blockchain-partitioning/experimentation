##Problems:
- Usage of non-DNS naming in files.
- ConfigMaps being mounted as symlinks (Fabric doesn't read symlinks properly).
- Repetition of keys and file contents in ConfigMap.

##Possible Fixes
###Usage of non-DNS naming in files
- Track usage of of non-POSIX filenames.
    - regex for non-POSIX: [^-._a-zA-Z0-9]+
- Rename non-POSIX filenames and use those as key.
- For each ConfigMap create a mapping of original name and new name.
- Use the mapping to populate `path` options for configmap keys in a volume.

####Steps
1. Which components/templates are affected?
    - cli-template
    - orderer-template
    - peer-template
1. Adjust templates accordingly.
    - Ensure folders as well as files are adjusted.
    
####Solution
ConfigMapVolume Template

If a configMap that is mounted as a volume contains data keys that were mapped to posix.
Then, the path those keys mount to should be changed to its original non-posix path.

See example below

    - name: config-volume
      configMap:
        name: special-config
        items:
        - key: special.level    <- Should be posix data key
          path: keys            <- Should contain non-posix path

####Reasoning
Allows bypassing non-DNS naming using the ``path`` option. While still using ConfigMaps as volumes.

###ConfigMaps being mounted as symlinks
1. PersistentVolumes
    - Use persistentVolumes + Claims
    - Mount confimaps into persistentVolume paths
1. Config-container
    - Read config for pods and creates files on volume.
    
####Reasoning
1. PersistentVolume files aren't mounted as symlinks afaik.
1. Allows circumvention of ConfigMap to volume mechanism.