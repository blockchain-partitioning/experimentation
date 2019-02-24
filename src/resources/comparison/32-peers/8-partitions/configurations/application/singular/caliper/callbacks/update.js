/**
 * Copyright 2017 HUAWEI. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */

'use strict';

module.exports.info = 'opening accounts';

let accounts = [];
let bc, contx;
module.exports.init = function (blockchain, context, args) {
    bc = blockchain;
    contx = context;
    return Promise.resolve();
};

const dictionary = 'abcdefghijklmnopqrstuvwxyz';

/**
 * Generate string by picking characters from dic variable
 * @param {*} number character to select
 * @returns {String} string generated based on @param number
 */
function get26Num(number) {
    let result = '';
    while (number > 0) {
        result += dictionary.charAt(number % 26);
        number = parseInt(number / 26);
    }
    return result;
}

let prefix;

/**
 * Generate unique account key for the transaction
 * @returns {String} account key
 */
function generateAccount() {
    // should be [a-z]{1,9}
    if (typeof prefix === 'undefined') {
        prefix = get26Num(process.pid);
    }
    return prefix + get26Num(accounts.length + 1);
}

module.exports.run = async function () {
    let newAccount = generateAccount();
    accounts.push(newAccount);
    return bc.invokeSmartContract(contx, 'simple-addition-chaincode', 'v0', {
        function: 'update',
        name: 'somekey',
        amount: 4.0,
        op: '+'
    }, 30);
};

module.exports.end = function (results) {
    return Promise.resolve();
};

module.exports.accounts = accounts;
