const Fs = require('fs-extra');
const Path = require('path');

const isDirectory = source => Fs.lstatSync(source).isDirectory();
const isFile = source => !isDirectory(source);
const getSubDirectories = source =>
    Fs.readdirSync(source).map(name => Path.join(source, name)).filter(isDirectory);
const getFiles = source => Fs.readdirSync(source).map(name => Path.join(source, name)).filter(isFile);

class Counter {
    constructor(rootPaths, matchTo, samnpleSize, amountOfRounds, countSingular) {
        this.paths = rootPaths;
        this.matchFilesTo = matchTo;
        this.sampleSize = samnpleSize;
        this.amountOfRounds = amountOfRounds;
        this.shouldCountSingular = countSingular;
        this.partitions = partitions;
    }

    count(partitions) {
        this.paths.forEach((path) => {
            this.countFiles(path, partitions);
        });

    }

    countFiles(path, partitions) {
        partitions.forEach((partition) => {
            console.log("Partitions:", partition);
            const resultsPath = Path.join(path, `${partition}-partitions`, "results");
            this.countTree(resultsPath);
            if (this.shouldCountSingular) {
                this.countSingular(resultsPath);
            }
        })
    }

    countSingular(resultsPath) {
        console.log("Singular");
        this.countFilesInPath(Path.join(resultsPath, "singular"))
    }

    countFilesInPath(path) {
        if (path.indexOf("root") === -1) {
            const files = getFiles(path);
            for (let round = 1; round < this.amountOfRounds + 1; round++) {
                const matchTo = `${this.matchFilesTo}-${round}`;
                let counter = 0;
                files.forEach((filePath) => {
                    if (filePath.indexOf(matchTo) > -1) {
                        counter++;
                    }
                });
                if (counter !== this.sampleSize * 2) {
                    console.log("Incorrect amount of files for round:", matchTo, "Found:", counter, "Expected:", this.sampleSize * 2, Path.basename(path));
                }
                else{
                    console.log("Correct amount of files for round:", matchTo);
                }
            }
        }
    }


    countTree(resultsPath) {
        console.log("Tree");
        const treePath = Path.join(resultsPath, "tree");
        const partitions = getSubDirectories(treePath);
        partitions.forEach((path) => {
            this.countFilesInPath(path);
        })
    }
}

const partitions = [2];
const setPaths = [
    "C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\32-peers"];
const sampleSize = 10;
const roundFileCounter = new Counter(setPaths, "round", sampleSize, 8, false);
const maxFileCounter = new Counter(setPaths, "max", sampleSize, 5, false);
roundFileCounter.count(partitions);
maxFileCounter.count(partitions);