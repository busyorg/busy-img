const crc = require('crc');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const imgBucket = process.env.IMG_STEEMCONNECT_BUCKET;

function getOptions(queryStringParameters, defaultParameters) {
    queryStringParameters = queryStringParameters || {};
    queryStringParameters.size = queryStringParameters.size || queryStringParameters.s;
    queryStringParameters.width = queryStringParameters.width || queryStringParameters.w || queryStringParameters.size;
    queryStringParameters.height = queryStringParameters.height || queryStringParameters.h || queryStringParameters.size;
    queryStringParameters.default = queryStringParameters.default || queryStringParameters.d;
    queryStringParameters.crop = queryStringParameters.crop || queryStringParameters.c;

    return {
        width: queryStringParameters.width || defaultParameters.width,
        height: queryStringParameters.height || defaultParameters.height,
        default: queryStringParameters.default || defaultParameters.default,
        crop: queryStringParameters.crop || defaultParameters.crop,
        username: defaultParameters.username
    };
}

function uploadToS3(imgBuffer, key, cache) {
    const params = {
        Bucket: imgBucket,
        Key: key,
        ACL: 'public-read',
        Body: imgBuffer,
        ContentType: 'image/png'
    };

    if(cache){ params.Tagging = 'cache=true'; }
    
    return new Promise((resolve,reject)=>{
        s3.putObject(params,(error,data)=> {
            console.log('err,',error,data);
            if(error) {
                reject(error);
            } else{
                resolve(`https://${s3.endpoint.hostname}/${imgBucket}/${key}`);
            }
        })
    });        
}

function getFileName(url, options) {
    options = options || {};
    return crc.crc32(`${url}_w${options.width}_h${options.height}`).toString(16);
}

function getS3Key(username, options){
    return [username,`${options.width}x${options.height}`, `${username}.png`].join('/');
}

module.exports = {
    getOptions,
    uploadToS3,
    getS3Key,
    getFileName
}