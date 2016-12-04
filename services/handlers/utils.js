const crc = require('crc');

function getOptions(queryStringParameters, defaultParameters) {
    queryStringParameters = queryStringParameters || {};
    queryStringParameters.size = queryStringParameters.size || queryStringParameters.s;
    queryStringParameters.width = queryStringParameters.width || queryStringParameters.w || queryStringParameters.size;
    queryStringParameters.height = queryStringParameters.height || queryStringParameters.h || queryStringParameters.size;
    queryStringParameters.default = queryStringParameters.default || queryStringParameters.d;
    queryStringParameters.crop = queryStringParameters.crop || queryStringParameters.c;

    return {
        width: queryStringParameters.width || defaultParameters.width,
        height: queryStringParameters.height || defaultParameters.height,
        default: queryStringParameters.default || defaultParameters.default,
        crop: queryStringParameters.crop || defaultParameters.crop,
        username: defaultParameters.username
    };
}

function getFileName(url, options) {
    return crc.crc32(`${url}_w${options.width}_h${options.height}`).toString(16);
}

module.exports = {
    getOptions,
    getFileName
}