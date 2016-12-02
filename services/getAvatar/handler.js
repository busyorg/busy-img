'use strict';
// var steem = require('steem');
var cloudinary = require('cloudinary');
var request = require('request');

function showImage(url) {
  return new Promise(function (resolve, reject) {
    if (url) {
      console.log('url', url);
      request.get(url).on('response', function (response) {
        var contentType = response.headers['content-type'] || '';
        console.log('contentType', contentType);
        if (response.statusCode == 200 && contentType.search('image') === 0) {
          console.log('img exisit', url);
          return resolve({ url: url });
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
  console.log('getDefaultImg', name);
  return cloudinary.url(name, options);
}

function showExternalImgOrDefault(url, defaultAvatar, options) {
  var fetchOptions = Object.assign({}, options, {
    type: 'fetch',
    sign_url: true,
    defaultAvatar: defaultAvatar
  });
  console.log('fetchOptions', fetchOptions);
  var newUrl = cloudinary.url(url, fetchOptions);
  console.log('newUrl', newUrl);
  return showImage(newUrl).catch(function (e) {
    return getDefaultImg(defaultAvatar, options);
  });
}

module.exports.getAvatar = (event, context, callback) => {
  const defaultAvatar = '@steemconnect';
  const username = event.pathParameters.username;
  const queryStringParameters = event.queryStringParameters || {};
  const width = queryStringParameters.width || queryStringParameters.size || 128;
  const height = queryStringParameters.height || queryStringParameters.size || 128;
  const crop = queryStringParameters.crop || 'fill';
  const options = { width: width, height: height, crop: crop };
  console.log('options', options);
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
          console.log('here');
          showExternalImgOrDefault(profile_image, defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 302,
              headers: { Location: image.url },
            };
            callback(null, result);
          });
        } else {
          console.log('no here');
          getDefaultImg(defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 302,
              headers: { Location: image.url },
            };
            callback(null, result);
          });
        }
      } else {
        const result = {
          statusCode: 500,
          body: JSON.stringify({
            error: error,
            body: body
          })
        };
        callback(null, result);
      }
    });
};

module.exports.getCover = (event, context, callback) => {
  const defaultAvatar = '@steemconnect/cover';
  const username = event.pathParameters.username;
  const queryStringParameters = event.queryStringParameters || {};
  const width = queryStringParameters.width || queryStringParameters.size || 850;
  const height = queryStringParameters.height || queryStringParameters.size || 300;
  const crop = queryStringParameters.crop || 'fill';
  const options = { width: width, height: height, crop: crop };
  console.log('options', options);
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
          console.log('here');
          showExternalImgOrDefault(cover_image, defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 302,
              headers: { Location: image.url },
            };
            callback(null, result);
          });
        } else {
          console.log('no here');
          getDefaultImg(defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 302,
              headers: { Location: image.url },
            };
            callback(null, result);
          });
        }
      } else {
        const result = {
          statusCode: 500,
          body: JSON.stringify({
            error: error,
            body: body
          })
        };
        callback(null, result);
      }
    })
}