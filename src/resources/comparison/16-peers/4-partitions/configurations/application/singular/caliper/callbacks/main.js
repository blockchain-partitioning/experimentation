/**
 * Copyright 2017 HUAWEI. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */


'use strict';

const fs = require('fs-extra');
const program = require('commander');
const Util = require('../../src/comm/util');

let configFile;
let networkFile;

/**
 * Set benchmark config file
 * @param {*} file config file of the benchmark,  default is config.json
 */
function setConfig(file) {
    configFile = file;
}

/**
 * Set benchmark network file
 * @param {*} file config file of the blockchain system, eg: fabric.json
 */
function setNetwork(file) {
    networkFile = file;
}

/**
 * Entry point of the Benchmarking script.
 */
function main() {
    program.version('0.1')
        .option('-c, --config <file>', 'config file of the benchmark, default is config.json', setConfig)
        .option('-n, --network <file>', 'config file of the blockchain system under test, if not provided, blockchain property in benchmark config is used', setNetwork)
        .parse(process.argv);

    if (!fs.existsSync(configFile)) {
        Util.log('Benchmark configuration file ' + configFile + ' does not exist');
        return;
    }

    if (!fs.existsSync(networkFile)) {
        Util.log('Network configuration file ' + networkFile + ' does not exist');
        return;
    }

    const framework = require('../../src/comm/bench-flow.js');
    framework.run(configFile, networkFile);
}

module.exports = main;