const Request = require('request');
const Configuration = require('../config');

const url = `http://${Configuration.application.rootTestRunnerExternalIpAddress}/start`;
Request.get(url);