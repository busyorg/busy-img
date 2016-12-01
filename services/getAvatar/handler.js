'use strict';
// var steem = require('steem');
var cloudinary = require('cloudinary');
var request = require('request');

var defaultAvatar = '@steemconnect';

function showImage(url, res) {
  return new Promise(function (resolve, reject) {
    if (url) {
      console.log('url', url);
      request.get(url).on('response', function (response) {
        console.log('response', response);
        var contentType = response.headers['content-type'] || '';
        if (response.statusCode == 200 && contentType.search('image') === 0) {
          console.log('img exisit', url);
          // res.writeHead(200, { 'Content-Type': contentType });
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

function getDefaultImg(res, name, options) {
  console.log('getDefaultImg', name);
  var url = cloudinary.url(name, options);
  return url;
  // res.writeHead(200, { 'Content-Type': 'image/png' });
  // request.get(url).pipe(res);
}

function showExternalImgOrDefault(url, res, defaultAvatar, options) {
  var fetchOptions = Object.assign({}, options, {
    type: 'fetch',
    sign_url: true,
    defaultAvatar: defaultAvatar
  });
  console.log('fetchOptions', fetchOptions);
  var newUrl = cloudinary.url(url, fetchOptions);
  console.log('newUrl', newUrl);
  return showImage(newUrl, res).catch(function (e) {
    return getDefaultImg(res, defaultAvatar, options);
  });
}

module.exports.getAvatar = (event, context, callback) => {
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
          showExternalImgOrDefault(profile_image, null, defaultAvatar, options).then((composedUrl) => {
            console.log('composedUrl', composedUrl);
            const result = {
              statusCode: 200,
              body: JSON.stringify({
                profile_image: profile_image,
                composedUrl: composedUrl,
              }),
            };
            callback(null, result);
          });
        } else {
          console.log('no here');
          getDefaultImg(null, defaultAvatar, options).then((composedUrl) => {
            console.log('composedUrl', composedUrl);
            const result = {
              statusCode: 200,
              body: JSON.stringify({
                profile_image: profile_image,
                composedUrl: composedUrl,
              }),
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
