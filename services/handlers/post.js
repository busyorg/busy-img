'use strict';
var cloudinary = require('cloudinary');
function sendResult(result, callback) {
    callback(null, {
        statusCode: 201, headers: {
            'Access-Control-Allow-Origin': '*'
        }, body: JSON.stringify(result)
    });
}

module.exports.Avatar = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    cloudinary.uploader.upload(`data:${contentType};base64,${event.body}`, (result) => {
        sendResult(result, callback);
    }, { public_id: username, tags: [username, 'profile_image'] });
}

module.exports.Cover = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    cloudinary.uploader.upload(`data:${contentType};base64,${event.body}`, (result) => {
        sendResult(result, callback);
    }, { public_id: `${username}/cover`, tags: [username, 'cover_image'] });
}

module.exports.Uploads = (event, context, callback) => {
    const username = event.pathParameters.username.match(/@?(\w+)/)[1];
    const contentType = event.headers['Content-Type'] || event.headers['content-type'];
    cloudinary.uploader.upload(`data:${contentType};base64,${event.body}`, (result) => {
        sendResult(result, callback);
    }, { tags: [username, 'general-upload'] });
}
