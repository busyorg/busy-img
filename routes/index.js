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

router.get('/@:username', function (req, res, next) {
  var username = req.params.username;
  var url = cloudinary.url('@' + username, { width: 128, height: 128, crop: 'fill' });
  steem.api.getAccounts([username], function (err, result) {
    try {
      if (err || result.length === 0) {
        throw new Error('image not found');
      } else {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          var profile_image = json_metadata.profile && json_metadata.profile.profile_image;
          if (profile_image) {
            http.get(addCloudinaryOptions(profile_image, 'c_fill,w_128,h_128'), function (response) {
              return response.pipe(res);
            })
          }
        } else if (url) {
          http.get(url, function (response) {
            return response.pipe(res);
          })
        } else {
          throw new Error('image not found');
        }
      }
    } catch (e) {
      var url = cloudinary.url('@busy', { width: 128, height: 128, crop: 'fill' });
      http.get(url, function (empty) {
        return empty.pipe(res);
      });
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

router.get('/@:username/cover', function (req, res, next) {
  var username = req.params.username;
  var url = cloudinary.url('@' + username + '/cover', { width: 900, height: 250, crop: 'fill' });
  steem.api.getAccounts([username], function (err, result) {
    try {
      if (err || result.length === 0) {
        throw new Error('image not found');
      } else {
        var json_metadata = result[0].json_metadata;
        if (json_metadata.length) {
          json_metadata = JSON.parse(json_metadata);
          var cover_image = json_metadata.profile && json_metadata.profile.cover_image;
          if (cover_image) {
            http.get(addCloudinaryOptions(cover_image, 'c_fill,w_900,h_250'), function (response) {
              return response.pipe(res);
            })
          }
        } else if (url) {
          http.get(url, function (response) {
            return response.pipe(res);
          })
        } else {
          throw new Error('image not found');
        }
      }
    } catch (e) {
      var url = cloudinary.url('@busy/cover', { width: 900, height: 250, crop: 'fill' });
      http.get(url, function (empty) {
        return empty.pipe(res);
      });
    }
  });
});


module.exports = router;