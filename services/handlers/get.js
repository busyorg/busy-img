'use strict';
// var steem = require('steem');
var cloudinary = require('cloudinary');
var request = require('request');

function showImage(url) {
    return new Promise(function (resolve, reject) {
        if (url) {
            request.get(url).on('response', function (response) {
                var contentType = response.headers['content-type'] || '';
                if (response.statusCode == 200 && contentType.search('image') === 0) {
                    return resolve(url);
                } else {
                    return reject(new Error('Img not found'));
                }
            });
        } else {
            return reject(new Error('invalid url not found'))
        }
    });
}

function getDefaultImg(name, options) {
    return options.default || cloudinary.url(name, options);
}

function showExternalImgOrDefault(url, defaultAvatar, options, cb) {
    var fetchOptions = Object.assign({}, options, { type: 'fetch', sign_url: true, defaultAvatar: defaultAvatar });
    var newUrl = cloudinary.url(url, fetchOptions);
    return showImage(newUrl, cb).catch(function (e) {
        cb(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
    }).then((url) => {
        cb(null, { statusCode: 302, headers: { Location: url } });
    });
}

function getOptions(queryStringParameters, defaultParameters) {
    queryStringParameters = queryStringParameters || {};
    queryStringParameters.size = queryStringParameters.size || queryStringParameters.s;
    queryStringParameters.width = queryStringParameters.width || queryStringParameters.w || queryStringParameters.size;
    queryStringParameters.height = queryStringParameters.height || queryStringParameters.h || queryStringParameters.size;
    queryStringParameters.default = queryStringParameters.default || queryStringParameters.d;
    return {
        size: queryStringParameters.size || queryStringParameters.size,
        width: queryStringParameters.width || queryStringParameters.width,
        height: queryStringParameters.height || queryStringParameters.height,
        default: queryStringParameters.default || queryStringParameters.default
    };
}

module.exports.Avatar = (event, context, callback) => {
    const defaultAvatar = '@steemconnect';
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 128, height: 128, crop: 'fill' });
    request({ url: 'https://api.steemjs.com/getAccounts?names[]=' + username, json: true },
        function (error, response, body) {
            var profile_image;
            if (body.length !== 0) {
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
            } else {
                callback(null, { statusCode: 302, headers: { Location: getDefaultImg(defaultAvatar, options) } });
            }
        });
};

module.exports.Cover = (event, context, callback) => {
    const defaultAvatar = '@steemconnect/cover';
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const options = getOptions(event.queryStringParameters, { width: 850, height: 300, crop: 'fill' });
    request({ url: 'https://api.steemjs.com/getAccounts?names[]=' + username, json: true },
        function (error, response, body) {
            var cover_image;
            if (body.length !== 0) {
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
