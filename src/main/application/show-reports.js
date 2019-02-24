const Open = require('opn');
const Configuration = require('../config');

Configuration.application.allExternalIpAddresses.forEach((ipAddress)=>{
    const url = `http://${ipAddress}/reports`;
    Open(url);
});