'use strict';
// var steem = require('steem');
var cloudinary = require('cloudinary');
var request = require('request');

var defaultAvatar = '@steemconnect';

// function defaultImg(res, name, options) {
//   debug('show defaultImg', name);
//   var url = cloudinary.url(name, options);
//   res.writeHead(200, { 'Content-Type': 'image/png' });
//   request.get(url).pipe(res);
// }

// function showExternalImgOrDefault(url, res, defaultAvatar, options) {
//   var fetchOptions = Object.assign({}, options, {
//     type: 'fetch',
//     sign_url: true,
//     defaultAvatar: defaultAvatar
//   });

//   var newUrl = cloudinary.url(url, fetchOptions);

//   return showImage(newUrl, res).catch(function (e) {
//     return defaultImg(res, defaultAvatar, options);
//   });
// }

module.exports.getAvatar = (event, context, callback) => {
  const username = event.pathParameters.username;
  request({ url: 'https://api.steemjs.com/getAccounts?names[]=' + username, json: true },
    function (error, response, body) {
      var profile_image;
      if (body.length !== 0) {
        var json_metadata = body[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          profile_image = json_metadata.profile && json_metadata.profile.profile_image;
        }

        // if (profile_image) {
        //   return showExternalImgOrDefault(profile_image, res, defaultAvatar, options);
        // } else {
        //   return defaultImg(res, defaultAvatar, options);
        // }
        const result = {
          statusCode: 200,
          body: JSON.stringify({
            profile_image: profile_image,
          }),
        };
        console.log(body) // Show the HTML for the Google homepage.
        callback(null, result);
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
