const Fs = require('fs-extra');
const Path = require('path');

const setPaths = [
    "C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\32-peers"];

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
    readFilesInPath(Path.join(resultsPath, "singular"))
}

function readFilesInPath(path) {
    readFiles(path, getFiles(path));
}

function fixTree(resultsPath) {
    const treePath = Path.join(resultsPath, "tree");
    const partitions = getSubDirectories(treePath);
    partitions.forEach((path) => {
        readFilesInPath(path);
    })
}

function readFiles(parent, filePaths) {
    filePaths.forEach((filePath) => {
        try {
            Fs.readJsonSync(filePath)
        }
        catch (e) {
            console.log("Cannot read file:", filePath, "Reason:", e.message);
        }
    })
}