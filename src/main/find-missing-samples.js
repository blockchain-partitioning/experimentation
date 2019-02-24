const Fs = require('fs-extra');
const Path = require('path');

const sampleSize = 10;
const setPaths = [
    "C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\16-peers"];

const isDirectory = stats => stats.isDirectory();
const isFile = stats => !isDirectory(stats);
const getSubDirectories = source =>
    Fs.readdirSync(source).map(name => Path.join(source, name)).filter(path => isDirectory(Fs.lstatSync(path)));
const getFiles = source => Fs.readdirSync(source).map(name => Path.join(source, name)).filter(path => isFile(Fs.lstatSync(path)));

class Locator {
    constructor(matchTo, sampleSize, amountOfRounds, countSingular) {

        this.matchFilesTo = matchTo;
        this.sampleSize = sampleSize;
        this.amountOfRounds = amountOfRounds;
        this.shouldLocateForSingular = countSingular;
        this.partitions = partitions;
    }

    locate(paths, partitions) {
        paths.forEach((path) => {
            this.locateForPartitions(path, partitions);
        });

    }

    locateForPartitions(path, partitions) {
        partitions.forEach((partition) => {
            const resultsPath = Path.join(path, `${partition}-partitions`, "results");
            this.locateInTree(resultsPath);
            if (this.shouldLocateForSingular) {
                this.locateInSingular(resultsPath);
            }
        })
    }

    locateInSingular(resultsPath) {
        console.log("Singular");
        this.locateMissingFilesInPath(Path.join(resultsPath, "singular"))
    }

    locateMissingFilesInPath(path) {
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
                    console.log("Incorrect amount of files for round:", matchTo, "Found:", counter, "Expected:", this.sampleSize * 2, path);
                }
                else {
                    console.log("Correct amount of files for round:", matchTo);
                }
            }
        }
    }

    locateInTree(resultsPath) {
        console.log("Tree");
        const treePath = Path.join(resultsPath, "tree");
        const partitions = getSubDirectories(treePath);
        partitions.forEach((path) => {
            this.locateMissingFilesInPath(path);
        })
    }

    compareLeafsAndRoot(treePath) {
        const partitions = getSubDirectories(treePath);
        partitions.forEach((path) => {
            compareDates(source, compareTo);
            this.locateMissingFilesInPath(path);
        })
    }

    compareTransactionFiles(treePath, amountOfPartitions, matchTo) {
        console.log(matchTo);
        const filesInLeafDirs = new Map();
        for (let leafNumber = 1; leafNumber <= amountOfPartitions; leafNumber++) {
            const leafPath = Path.join(treePath, `leaf-${leafNumber}`);
            filesInLeafDirs.set(leafNumber, getFiles(leafPath));
        }

        const alreadyChecked = new Map();
        let sourcePaths = filesInLeafDirs.get(1).filter(sourcePath => sourcePath.indexOf(matchTo) > -1);
        const store = new Map();
        const noMatch = new Map();
        sourcePaths.forEach(sourcePath => {
            for (let i = 2; i <= amountOfPartitions; i++) {
                const leafFiles = filesInLeafDirs.get(i);
                leafFiles.forEach(comparePath => {
                    if (!alreadyChecked.has(comparePath) && Locator.filesCreatedCloseAfter(sourcePath, comparePath, matchTo)) {
                        if (store.has(sourcePath)) {
                            const val = store.get(sourcePath);
                            val.push(comparePath);
                            store.set(sourcePath, val);
                        }
                        else {
                            const set = [comparePath];
                            store.set(sourcePath, set)
                        }
                        alreadyChecked.set(comparePath, true);
                    }
                })
            }
            if (!store.has(sourcePath)) {
                noMatch.set(sourcePath, true);
            }
        });
        store.forEach((value, key) => {
            if (value.length !== amountOfPartitions - 1)
                console.log(`${key} amount of matches - ${value.length} \n ${value}`);
        });
        noMatch.forEach((value, key) => {
            console.log(`${key} - no match`);
        });

        console.log(store.size)
    }

    static filesCreatedCloseAfter(sourcePath, comparePath, matchTo) {
        if (comparePath.indexOf(matchTo) > -1) {
            return Locator.compareDates(Locator.fileCreationDate(sourcePath), Locator.fileCreationDate(comparePath), 60000);
        }
        return false;
    }

    static compareDates(source, compareTo, maxDifferenceInMillis) {
        let difference = undefined;
        if (source.valueOf() === compareTo.valueOf()) {
            return true;
        }
        if (source.valueOf() > compareTo.valueOf()) {
            difference = source.valueOf() - compareTo.valueOf();
        }
        if (source.valueOf() < compareTo.valueOf()) {
            difference = compareTo.valueOf() - source.valueOf();

        }
        return difference < maxDifferenceInMillis;

    }

    static fileCreationDate(path) {
        return Fs.lstatSync(path).ctime;
    }
}

const partitions = [2, 4, 8];
// const roundFileCounter = new Locator(setPaths, "round", sampleSize, 8, true);
// const maxFileCounter = new Locator(setPaths, "max", sampleSize, 5, false);
// roundFileCounter.count(partitions);
// maxFileCounter.count(partitions);

partitions.forEach(partition => {
    console.log("Partitions", partition);
    const maxLoc = new Locator();
    for (let i = 1; i <= 5; i++) {
        maxLoc.compareTransactionFiles(`C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\16-peers\\${partition}-partitions\\results\\tree`, partition, `max-${i}-transactions`);
    }
    const roundloc = new Locator();
    for (let i = 1; i <= 8; i++) {
        roundloc.compareTransactionFiles(`C:\\Users\\rober\\Desktop\\experiments\\src\\resources\\comparison\\16-peers\\${partition}-partitions\\results\\tree`, partition, `round-${i}-transactions`);
    }
});

