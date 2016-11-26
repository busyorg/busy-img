var cloudinary = require('cloudinary');
var express = require('express');
var request = require('request');
var limiter = require('limiter');
var multipart = require('connect-multiparty');
var steem = require('steem');
var debug = require('debug')('steem-img');

var multipartMiddleware = multipart();
// 2000 calls an hour because we're on the Bronze plan, usually would be 500
var cloudinaryRateLimiter = new limiter.RateLimiter(2000, 'hour');
var router = express.Router();

var defaultAvatar = '@steemconnect';

function addCloudinaryOptions(url, options) {
  debug('addCloudinaryOptions', url, options);
  var optionsString = typeof options === 'string' && options;
  if (!optionsString) {
    optionsString = '';
    var optionsKeys = Object.keys(options);
    for (var i = 0; i < optionsKeys.length; i++) {
      var key = optionsKeys[i];
      optionsString += key.substring(0, 1) + '_' + options[key] + ',';
    }
    optionsString = optionsString.substring(0, optionsString.length - 1);
  }
  var urlArray = url.split('/');
  if (urlArray[6]) {
    urlArray.splice(6, 0, optionsString);
    url = urlArray.join('/')
  }
  return url;
}

function showImage(url, res) {
  debug('showImage', url);
  return new Promise(function (resolve, reject) {
    if (url) {
      request.get(url).on('response', function (response) {
        var contentType = response.headers['content-type'] || '';
        if (response.statusCode == 200 && contentType.search('image') === 0) {
          res.writeHead(200, { 'Content-Type': contentType });
          return resolve(response.pipe(res));
        } else {
          debug('showImage Img not found', url, response.statusCode, contentType);
          return reject(new Error('Img not found'));
        }
      });
    } else {
      debug('showImage invalid url not found', url);
      return reject(new Error('invalid url not found'))
    }
  });

}

function defaultImg(res, name, options) {
  debug('show defaultImg', name);
  var url = cloudinary.url(name, options);
  res.writeHead(200, { 'Content-Type': 'image/png' });
  request.get(url).pipe(res);
}

function showExternalImgOrDefault(url, res, defaultAvatar, options) {
  return showImage(addCloudinaryOptions(url, options), res)
    .catch(function (e) {
      return defaultImg(res, defaultAvatar, options);
    });
}

router.get('/@:username', function (req, res, next) {
  var username = req.params.username;
  steem.api.getAccounts([username], function (err, result) {
    try {
      var options = { width: 128, height: 128, crop: 'fill' };
      var profile_image;
      if (!err && result.length !== 0) {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          profile_image = json_metadata.profile && json_metadata.profile.profile_image;
        }
      }

      if (profile_image) {
        return showExternalImgOrDefault(profile_image, res, defaultAvatar, options);
      } else {
        return defaultImg(res, defaultAvatar, options);
      }
    } catch (e) {
      debug('error in get /@' + username, e);
      return defaultImg(res, defaultAvatar, options);
    }
  });
});

router.get('/@:username/cover', function (req, res, next) {
  var username = req.params.username;
  steem.api.getAccounts([username], function (err, result) {
    try {
      var options = { width: 900, height: 250, crop: 'fill' };
      var cover_image;
      if (!err && result.length !== 0) {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          cover_image = json_metadata.profile && json_metadata.profile.cover_image;
        }
      }

      if (cover_image) {
        return showExternalImgOrDefault(cover_image, res, defaultAvatar + '/cover', options);
      } else {
        return defaultImg(res, defaultAvatar + '/cover', options);
      }
    } catch (e) {
      return defaultImg(res, defaultAvatar + '/cover', options);
    }
  });
});

router.post('/@:username', multipartMiddleware, function (req, res, next) {
  var username = req.params.username;
  var file = req.files;
  var path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, function (result) {
    res.json({ url: result.url });
  }, {
      public_id: '@' + username,
      tags: [
        '@' + username,
        'profile_image'
      ]
    });
  delete req.files;
});

router.post('/@:username/cover', multipartMiddleware, function (req, res, next) {
  var username = req.params.username;
  var file = req.files;
  var path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, function (result) {
    res.json({ url: result.url });
  }, {
      public_id: '@' + username + '/cover',
      tags: [
        '@' + username,
        'cover_image'
      ]
    });
  delete req.files;
});

/*!
 * POST /@:username/uploads
 *
 * Uploads a file to cloudinary and responds with the result. Requires one
 * multipart form file field
 */

router.post('/@:username/uploads', multipartMiddleware, function (req, res, next) {
  var username = req.params.username;
  var files = req.files;
  var keys = Object.keys(files);

  if (!keys[0]) {
    var err = new Error('Missing a file parameter');
    err.status = 422;
    return next(err);
  }

  var path = files[keys[0]].path;
  cloudinary.uploader.upload(path, function (result) {
    res.status(201);
    res.json(result);
  }, {
      tags: [
        '@' + username,
        'general-upload'
      ]
    });
});

/*!
 * GET /@:username/uploads
 *
 * Gets an user's uploads by querying cloudinary for its tag
 */

router.get('/@:username/uploads', function (req, res, next) {
  var username = req.params.username;
  cloudinaryRateLimiter.removeTokens(1, function () {
    // ^^ Error isn't relevant here, see
    // https://www.npmjs.com/package/limiter#usage

    cloudinary.api.resources_by_tag('@' + username, function (result) {
      res.json(result.resources);
    });
  });
});

module.exports = router;
