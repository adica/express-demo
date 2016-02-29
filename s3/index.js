'use strict';
const path = require('path');
const fs = require('fs');
const mime = require('mime');
mime.define({
    'application/json': ['config']
});
const settings = require('./settings.json');
const Promise = require('promise');
const knox = require('knox');

const aws = knox.createClient({
    key: process.env.AWS_ACESS,
    secret: process.env.AWS_SECRET,
    bucket: settings.bucket
});


const s3 = require('s3');
const client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.AWS_ACESS,
        secretAccessKey: process.env.AWS_SECRET,
        region: "us-east-1"
    },
});




var exports = module.exports = {};

//list
exports.list = function(req, res, next) {
    aws.list({
        prefix: settings.bucketPath
    }, function(err, data) {
        if (err) {
            console.log('error: ', err);
            next(err);
        }
        res.send(data);
    });
}

//get
exports.getById = function(req, res, next) {
    aws.get(settings.bucketPath + req.params.id + '/template.config')
        .on('error', function(err) {
            console.log('error: ', err);
            next(err);
        })
        .on('response', function(resp) {
            if (resp.statusCode !== 200) {
                var err = new Error()
                err.status = 404
                next(err)
                return
            }

            if (req.fresh) {
                res.statusCode = 304
                res.end()
                return
            }

            if (req.method === 'HEAD') {
                res.statusCode = 200
                res.end()
                return
            }

            resp.pipe(res);
        }).end();
};

exports.post = function(req, res, next) {
    //TODO - take files from client and not from temp location
    let localDirectory = path.join(__dirname, '..', 'temp/HX3CDW4NJW/');

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
        res.json({ saved: settings.bucketPath + 'HX3CDW4NJW/' });
    });


};

//post with knox
/*exports.post = function(req, res, next) {
    //TODO - take files from client and not from temp location
    let templFiles = path.join(__dirname, '..', 'temp/HX3CDW4NJW/');

    fs.readdir(templFiles, function(err, files) {

        files.forEach(function(file) {

            let fullPath = templFiles + file;
            fs.stat(fullPath, function(err, stat) {
                if (err) throw Error(err)
                var req = aws.put(settings.bucketPath + 'HX3CDW4NJW/' + file, {
                    'Content-Length': stat.size,
                    'Content-Type': mime.lookup(file),
                    'x-amz-acl': 'public-read'
                });

                fs.createReadStream(fullPath).pipe(req);

                req.on('response', function(resp) {
                    resp.pipe(res);
                });
            });

        });
    });
};*/



//put
exports.put = function(req, res, next) {
    var buffer = new Buffer(JSON.stringify(req.body));
    var headers = {
        'Content-Type': 'application/json'
    };
    aws.putBuffer(buffer, settings.bucketPath + req.params.id + '/template.config', headers, function(err, resp) {
        resp.pipe(res);
    });

};

//delete
exports.del = function(req, res, next) {
    aws.del(settings.bucketPath + req.params.id + '/template.config').on('response', function(resp) {
        console.log(resp.statusCode);
        resp.pipe(res);
    }).end();
};
