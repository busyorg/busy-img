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
          response.on('data', (chunk) => {
            var buffer = new Buffer(chunk);
            return resolve({ data: buffer.toString('base64'), url: url, contentType });
          });

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
  var url = cloudinary.url(name, options);
  request.get(url).on('data', (chunk) => {
    var buffer = new Buffer(chunk);
    return resolve({ data: buffer.toString('base64'), url: url, contentType: 'image/jpeg' });
  });
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
              statusCode: 200,
              body: `data:${image.contentType};base64,${image.data}`,
              isBase64Encoded: true,
              headers: {
                // 'Content-Type': image.contentType
              },
            };
            console.log('result', result);
            callback(null, result);
          });
        } else {
          console.log('no here');
          getDefaultImg(defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 200,
              body: `data:${image.contentType};base64,${image.data}`,
              isBase64Encoded: true,
              headers: {
                // 'Content-Type': image.contentType
              },
            };
            console.log('result', result);
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
  // console.log('begin', steem, Date.now());
  // return steem.api.getAccountsAsync(['nil1511']).then((result) => {
  //   console.log('result', Date.now());
  // var profile_image;
  // if (result.length !== 0) {
  //   var json_metadata = result[0].json_metadata;
  //   if (json_metadata.length) {
  //     json_metadata = JSON.parse(json_metadata);
  //     profile_image = json_metadata.profile && json_metadata.profile.profile_image;
  //   }
  // }
  //   console.log('profile_image', profile_image, result);
  // const response = {
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     message: 'Go getAvatar get!',
  //     profile_image: profile_image,
  //   }),
  // };
  // console.log('callback', response)
  //   callback(null, response);
  // });
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
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
              statusCode: 200,
              body: `data:${image.contentType};base64,${image.data}`,
              isBase64Encoded: true,
              headers: {
                // 'Content-Type': image.contentType
              },
              isBase64Encoded: true,

            };
            console.log('result', result);
            callback(null, result);
          });
        } else {
          console.log('no here');
          getDefaultImg(defaultAvatar, options).then((image) => {
            console.log('image', image);
            const result = {
              statusCode: 200,
              body: `data:${image.contentType};base64,${image.data}`,
              isBase64Encoded: true,
              headers: {
                // 'Content-Type': image.contentType
              },
            };
            console.log('result', result);
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