const Fs = require('fs');
const Path = require('path');

const setPaths = ["C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\4-peers",
    "C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\8-peers"];

const isDirectory = source => Fs.lstatSync(source).isDirectory();
const isFile = source => !isDirectory(source);
const getSubDirectories = source =>
    Fs.readdirSync(source).map(name => Path.join(source, name)).filter(isDirectory);
const getFiles = source => Fs.readdirSync(source).map(name => Path.join(source, name)).filter(isFile);

setPaths.forEach((path) => {
    fixExperiment(path);
});

function fixExperiment(path) {
    const subDirectories = getSubDirectories(path);
    subDirectories.forEach((experimentPath) => {
        const resultsPath = Path.join(experimentPath, "results");
        fixSingular(resultsPath);
        fixTree(resultsPath);
    })
}

function fixSingular(resultsPath) {
    renameFilesInPath(Path.join(resultsPath, "singular"))
}

function renameFilesInPath(path) {
    renameFiles(path, getFiles(path));
}

function fixTree(resultsPath) {
    const treePath = Path.join(resultsPath, "tree");
    const partitions = getSubDirectories(treePath);
    partitions.forEach((path) => {
        renameFilesInPath(path);
    })
}

function renameFiles(parent, filePaths) {
    filePaths.forEach((filePath) => {
        let filename = Path.basename(filePath);
        filename = filename.replace(/[^0-9a-z-]/gi, '-');
        filename = filename.replace(/-json/gi, '.json');
        Fs.renameSync(filePath, Path.join(parent, filename));
    })
}