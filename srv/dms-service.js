const cds = require('@sap/cds');
const dms = require('./dms');

module.exports = cds.service.impl(function () {

    this.on('downloadDocument', dms.downloadDocumentHandler);

});