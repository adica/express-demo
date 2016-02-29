const settings = require('./s3/settings.json');
const path = require('path');

const s3 = require('s3');
const client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.AWS_ACESS,
        secretAccessKey: process.env.AWS_SECRET,
        region: "us-east-1"
    },
});

const localDirectory = path.join(__dirname, 'temp/HX3CDW4NJW/');


const params = {
    localDir: localDirectory,
    deleteRemoved: true,
    s3Params: {
        Bucket: settings.bucket,
        Prefix: settings.bucketPath + 'HX3CDW4NJW/',
        ACL: 'public-read'
    },
};

const uploader = client.uploadDir(params);
uploader.on('error', function(err) {
    console.error("unable to sync:", err.stack);
});
uploader.on('progress', function() {
    console.log("progress", uploader.progressAmount, uploader.progressTotal);
});
uploader.on('end', function() {
    console.log("done uploading");
});
