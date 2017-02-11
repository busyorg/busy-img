'use strict';
const Promise = require('bluebird');
const {getFileName, uploadToS3} = require('./utils');
const gm = require('gm').subClass({ imageMagick: true });
Promise.promisifyAll(gm.prototype);

function processImage(buffer, key, callback) {
    gm(new Buffer(buffer, 'base64'))
        .compress('jpeg')
        .toBuffer('png', (err, newBuffer) => {
            if (err)
                callback(null, {
                    statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(err)
                });
            return uploadToS3(newBuffer, key).then((url) => {
                callback(null, {
                    statusCode: 201, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ url })
                });
            });
        })
}

module.exports.Avatar = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const s3Key = [username, `${getFileName('profile_image' + Math.random())}.png`].join('/');
    processImage(new Buffer(event.body, 'base64'), s3Key, callback);
}

module.exports.Cover = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const s3Key = [username, `${getFileName('cover_image' + Math.random())}.png`].join('/');
    processImage(new Buffer(event.body, 'base64'), s3Key, callback);
}

module.exports.Uploads = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const s3Key = [username, `${getFileName('general-upload' + Math.random())}.png`].join('/');
    processImage(new Buffer(event.body, 'base64'), s3Key, callback);
}
