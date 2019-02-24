import * as Path from "path";

function MountPaths(workingDirectory){
    const network = Path.posix.join(workingDirectory, "network");
    const networkConfigurationFile = Path.posix.join(network, "configuration.json");

    const benchmark = Path.posix.join(workingDirectory, "benchmark");
    const benchmarkCallbacks = Path.posix.join(benchmark, "callbacks");
    const benchmarkConfigurationFile = Path.posix.join(benchmark, "configuration.json");

    const cryptographicMaterial = Path.posix.join(network, "crypto");
    const channels = Path.posix.join(network, "channels");
    const goPath = Path.posix.join(workingDirectory, "golang");
    const chaincodes =  Path.posix.join(goPath, "src"); //See fabric-client/lib/packager/GoLang.js->package()
    const funnelRoot = Path.posix.join(Path.posix.sep, "usr", "src", "app");
    const funnelFrom = Path.posix.join(funnelRoot, "from");
    const funnelTo = Path.posix.join(funnelRoot, "to");
    const reports = Path.posix.join(workingDirectory, "reports");
    return {
        workingDirectory,
        network,
        networkConfigurationFile,
        benchmark,
        benchmarkCallbacks,
        benchmarkConfigurationFile,
        cryptographicMaterial,
        channels,
        chaincodes,
        funnelFrom,
        funnelTo,
        goPath,
        reports
    }
}

export default MountPaths