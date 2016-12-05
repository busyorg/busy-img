'use strict';
// var steem = require('steem');
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
const {getOptions, uploadToS3, getFileName} = require('./utils');
const imgBucket = process.env.IMG_STEEMCONNECT_BUCKET;

console.log('tmpFile', tmpFile);
function showImage(url, options) {
    return new Promise(function (resolve, reject) {
        if (url) {
            const before = Date.now();
            let fetched;
            let processed;
            console.log(options);
            return rp({ uri: url, encoding: null, }) //gm.thumb forces u to output file :(
                .then((body) => {
                    fetched = Date.now();
                    console.log('fetched in ', fetched - before);
                    return gm(body).thumbAsync(options.width, options.height, tmpFile, 85, 'center')
                }).then(() => {
                    const imgBuffer = fs.readFileSync(tmpFile);
                    processed = Date.now();
                    console.log('processed', processed - fetched);
                    const s3Key = [options.username, getFileName(url, options) + '.jpg'].join('/');
                    return uploadToS3(imgBuffer, s3Key);
                }).then((newUrl) => {
                    console.log('uploaded in ', Date.now() - processed);
                    console.log('total in ', Date.now() - before);
                    return resolve(newUrl);
                })
        } else {
            return reject(new Error('invalid url not found'))
        }
    });
}


function getDefaultImg(name, options) {
    return options.default || cloudinary.url(name, options);
    // return `https://${s3.endpoint.hostname}/${imgBucket}/${name}`;
}

function showExternalImgOrDefault(url, defaultAvatar, options, cb) {
    const key = [options.username, getFileName(url, options) + '.jpg'].join('/');
    const params = { Bucket: imgBucket, Key: key };
    console.log('url', url, key);
    return s3.getObjectAsync(params)
        .then((data) => {
            console.log('data', data.ContentLength);
            cb(null, { statusCode: 302, headers: { Location: `https://${s3.endpoint.hostname}/${imgBucket}/${key}` } });
        }).catch((err => {
            console.log('err', err.statusCode);
            return showImage(url, options).catch(function (e) {
                cb(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }).then((url) => {
                cb(null, { statusCode: 302, headers: { Location: url } });
            });
        }))
}

module.exports.Avatar = (event, context, callback) => {
    const defaultAvatar = '@steemconnect';
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 128, height: 128, crop: 'fill', username });
    request({ url: 'https://api.steemjs.com/getAccounts?names[]=' + username, json: true },
        function (error, response, body) {
            var profile_image;
            if (body.length !== 0) {
                try {
                    var json_metadata = body[0].json_metadata;
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

            } else {
                callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }
        });
};

module.exports.Cover = (event, context, callback) => {
    const defaultAvatar = '@steemconnect/cover';
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 850, height: 300, crop: 'fill', username });
    request({ url: 'https://api.steemjs.com/getAccounts?names[]=' + username, json: true },
        function (error, response, body) {
            var cover_image;
            if (body.length !== 0) {
                try {
                    var json_metadata = body[0].json_metadata;
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
            } else {
                callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }
        })
}

module.exports.Uploads = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    cloudinary.api.resources_by_tag(username, function (result) {
        callback(null, { statusCode: 200, body: JSON.stringify(result.resources) });
    });
}
