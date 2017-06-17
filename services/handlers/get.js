'use strict';
const Promise = require('bluebird');
var cloudinary = require('cloudinary');
var request = require('request');
var fs = require('fs');
const rp = require('request-promise');
const gm = require('gm').subClass({ imageMagick: true });
Promise.promisifyAll(gm.prototype);
const path = require('path');
const tmpFile = path.join(require('os').tmpdir(), 'overwrite');
const AWS = require('aws-sdk');
const s3 = Promise.promisifyAll(new AWS.S3());
const { getOptions, uploadToS3, getFileName } = require('./utils');
const imgBucket = process.env.IMG_STEEMCONNECT_BUCKET;
const FETCH_IMG_TIMEOUT = 8000;

function showImage(url, options) {
    return new Promise(function (resolve, reject) {
        const before = Date.now();
        let processed;
        console.log(options);
        if (!url || url.length === 0) {
            return reject(new Error('invalid url not found'))
        }
        return rp({ uri: url, encoding: null, timeout: FETCH_IMG_TIMEOUT }) //gm.thumb forces u to output file :(
            .then((body) => {
                return gm(body)
                    .quality(95)
                    .resize(options.width, options.height, "^")
                    .gravity("Center")
                    .background('none').flatten()
                    .extent(options.width, options.height)
                    .noProfile()
                    .writeAsync(tmpFile);
            }).then(() => {
                const imgBuffer = fs.readFileSync(tmpFile);
                processed = Date.now();
                if (imgBuffer.length === 0) {
                    return reject(new Error('not processable'));
                }
                const s3Key = [options.username, getFileName(url, options) + '.png'].join('/');
                return uploadToS3(imgBuffer, s3Key);
            }).then((newUrl) => {
                console.log('uploaded in ', Date.now() - processed);
                console.log('total in ', Date.now() - before);
                return resolve(newUrl);
            }).catch((err) => {
                console.log('err', err);
                return reject(new Error('invalid url not found'))
            })
    });
}

function getProfile(username, cb) {
    request.get({
        url: `https://steemdb.com/api/account/${username}`,
        json: true
    }, function (error, response, body) {
        cb(body)
    });
}

function getDefaultImg(name, options) {
    return options.default || cloudinary.url(name, Object.assign({}, options, { secure: true }));
    // return `https://${s3.endpoint.hostname}/${imgBucket}/${name}`;
}

function showExternalImgOrDefault(url, defaultAvatar, options, cb) {
    const key = [options.username, getFileName(url, options) + '.png'].join('/');
    const params = { Bucket: imgBucket, Key: key };
    console.log('url', url, key);
    return s3.getObjectAsync(params)
        .then((data) => {
            cb(null, { statusCode: 302, headers: { Location: `https://${s3.endpoint.hostname}/${imgBucket}/${key}` } });
        }).catch((err => {
            return showImage(url, options).catch(function (e) {
                cb(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }).then((url) => {
                cb(null, { statusCode: 302, headers: { Location: url } });
            });
        }))
}

module.exports.Avatar = (event, context, callback) => {
    const defaultAvatar = '@steemconnect';
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 128, height: 128, crop: 'fill', username });
    getProfile(username,
        function (body) {
            var profile_image;
            try {
                var json_metadata = body.json_metadata;
                if (json_metadata.length) {
                    json_metadata = JSON.parse(json_metadata);
                    profile_image = json_metadata.profile && json_metadata.profile.profile_image;
                }
                if (profile_image) {
                    showExternalImgOrDefault(profile_image, defaultAvatar, options, callback);
                } else {
                    callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
                }
            } catch (e) {
                callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }
        });
};

module.exports.Cover = (event, context, callback) => {
    const defaultAvatar = '@steemconnect/cover';
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 850, height: 300, crop: 'fill', username });
    getProfile(username,
        function (body) {
            var cover_image;
            try {
                var json_metadata = body.json_metadata;
                if (json_metadata.length) {
                    json_metadata = JSON.parse(json_metadata);
                    cover_image = json_metadata.profile && json_metadata.profile.cover_image;
                }
                if (cover_image) {
                    showExternalImgOrDefault(cover_image, defaultAvatar, options, callback);
                } else {
                    callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
                }
            } catch (e) {
                callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }
        })
}

module.exports.Uploads = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?([\w-.]+)/)[1];
    const params = { Bucket: imgBucket, Prefix: username };
    return s3.listObjectsV2Async(params)
        .then((data) => {
            const listOfItems = data.Contents.map((object) => `https://${s3.endpoint.hostname}/${imgBucket}/${object.Key}`);
            callback(null, { statusCode: 200, body: JSON.stringify(listOfItems) });
        })
        .catch((err) => {
            console.log('err', err);
            callback(null, { statusCode: 200, body: JSON.stringify({}) });
        })
}
