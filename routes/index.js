var express = require('express');
var steem = require('steem');
var router = express.Router();

var cloudinary = require('cloudinary'),
  multipart = require('connect-multiparty'),
  multipartMiddleware = multipart(),
  http = require('http');

function addCloudinaryOptions(url, options) {
  var urlArray = url.split('/');
  if (urlArray[6]) {
    urlArray.splice(6, 0, options)
    url = urlArray.join('/')
  }
  return url;
}

function getCloundaryImg(url, res, defaultName, defaultOptions) {
  if (url) {
    http.get(url, function (response) {
      if (response.statusCode == 200)
        return response.pipe(res);
      else
        return defaultImg(res, defaultName, defaultOptions);
    })
  } else {
    return defaultImg(res, defaultName, defaultOptions);
  }
}

function defaultImg(res, name, options) {
  var url = cloudinary.url(name, options);
  http.get(url, function (empty) {
    return empty.pipe(res);
  });
}

router.get('/@:username', function (req, res, next) {
  var username = req.params.username;
  steem.api.getAccounts([username], function (err, result) {
    try {
      var url = cloudinary.url('@' + username, { width: 128, height: 128, crop: 'fill' });
      if (!(err && result.length === 0)) {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          var profile_image = json_metadata.profile && json_metadata.profile.profile_image;
          if (profile_image) {
            var profile_image_url = addCloudinaryOptions(profile_image, 'c_fill,w_128,h_128');
            return getCloundaryImg(profile_image_url, res, '@busy', { width: 128, height: 128, crop: 'fill' });
          }
        }
        return getCloundaryImg(url, res, '@busy', { width: 128, height: 128, crop: 'fill' });
      } else {
        return defaultImg(res, '@busy', { width: 128, height: 128, crop: 'fill' });
      }
    } catch (e) {
      return defaultImg(res, '@busy', { width: 128, height: 128, crop: 'fill' });
    }
  });
});

router.get('/@:username/cover', function (req, res, next) {
  var username = req.params.username;
  steem.api.getAccounts([username], function (err, result) {
    try {
      var url = cloudinary.url('@' + username + '/cover', { width: 900, height: 250, crop: 'fill' });
      if (!(err && result.length === 0)) {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          var cover_image = json_metadata.profile && json_metadata.profile.cover_image;
          if (cover_image) {
            var cover_image_url = addCloudinaryOptions(cover_image, 'c_fill,w_900,h_250');
            return getCloundaryImg(cover_image_url, res, '@busy/cover', { width: 900, height: 250, crop: 'fill' });
          }
        }
        return getCloundaryImg(url, res, '@busy/cover', { width: 900, height: 250, crop: 'fill' });
      } else {
        return defaultImg(res, '@busy/cover', { width: 900, height: 250, crop: 'fill' });
      }
    } catch (e) {
      return defaultImg(res, '@busy/cover', { width: 900, height: 250, crop: 'fill' });
    }
  });
});

router.post('/@:username', multipartMiddleware, function (req, res, next) {
  var username = req.params.username;
  var file = req.files;
  var path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, function (result) {
    res.json({ url: result.url });
  }, { public_id: '@' + username });
  delete req.files;
});

router.post('/@:username/cover', multipartMiddleware, function (req, res, next) {
  var username = req.params.username;
  var file = req.files;
  var path = file[Object.keys(file)[0]].path;
  cloudinary.uploader.upload(path, function (result) {
    res.json({ url: result.url });
  }, { public_id: '@' + username + '/cover' });
  delete req.files;
});


module.exports = router;