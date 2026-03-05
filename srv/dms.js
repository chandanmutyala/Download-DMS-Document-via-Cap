const cds = require('@sap/cds');
const { executeHttpRequest, getDestination } = require("@sap-cloud-sdk/core");

const repoId = '79fa6e2e-ef0c-4caf-8b14-4fc288b20a1c';


async function downloadDocumentHandler(req) {

    const LOG = cds.log('dms-download');

    try {

        LOG.info('Download request received');

        const { objectId, folderId } = req.data;

        // Validate request input
        if (!objectId) {
            LOG.error('Missing objectId in request');
            req._.res.status(400).send("objectId is required");
            return null;
        }

        LOG.info(`ObjectId received: ${objectId}`);
        LOG.info(`FolderId received: ${folderId}`);

        // In real case you may fetch filename from DMS
        const filename = "download.png";

        if (!filename) {
            LOG.warn(`Filename not found for objectId: ${objectId}`);
            req._.res.status(404).send("File not found");
            return null;
        }

        LOG.info(`Preparing to fetch file from DMS. Filename: ${filename}`);

        // Get destination
        let destination;
        try {
            destination = await getDestination('DMS_DEST');
            LOG.info('Destination DMS_DEST retrieved successfully');
        } catch (destError) {
            LOG.error('Failed to retrieve destination', destError);
            req._.res.status(500).send("Destination configuration error");
            return null;
        }

        // Construct CMIS content URL
        const url = `/browser/${repoId}/root?objectId=${objectId}&cmisselector=content`;

        LOG.info(`Calling DMS URL: ${url}`);

        // Call DMS
        let response;
        try {

            response = await executeHttpRequest(destination, {
                method: "GET",
                url: url,
                responseType: "arraybuffer"
            });

            LOG.info(`DMS responded with status: ${response.status}`);

        } catch (httpError) {

            LOG.error('DMS request failed');

            if (httpError.response) {
                LOG.error(`DMS status: ${httpError.response.status}`);
                LOG.error(httpError.response.data);
            } else {
                LOG.error(httpError.message);
            }

            req._.res.status(500).send("Error while retrieving file from DMS");
            return null;
        }

        // Send file to client
        try {

            req._.res.setHeader("Content-Type", "application/octet-stream");
            req._.res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

            req._.res.end(response.data);

            LOG.info(`File ${filename} downloaded successfully`);

        } catch (streamError) {

            LOG.error('Error while streaming file to client', streamError);

            req._.res.status(500).send("File streaming failed");

        }

    } catch (unexpectedError) {

        LOG.error('Unexpected error occurred', unexpectedError);

        req._.res.status(500).send("Unexpected server error");

    }

    return null;
}

module.exports = {
    downloadDocumentHandler
};