'use strict';
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const settings = require('./settings.json');
const Promise = require('promise');
const knox = require('knox');
const Unzipper = require("decompress-zip");
const s3 = require('s3');
const rmdir = require('rimraf');

const aws = knox.createClient({
    key: process.env.AWS_ACESS,
    secret: process.env.AWS_SECRET,
    bucket: settings.bucket
});

const client = s3.createClient({
    s3Options: {
        accessKeyId: process.env.AWS_ACESS,
        secretAccessKey: process.env.AWS_SECRET,
        region: "us-east-1"
    },
});

mime.define({
    'application/json': ['config']
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

    //take file from request
    if (req.file) {

        var filepath = path.join(req.file.destination, req.file.filename);
        var unzipper = new Unzipper(filepath);

        unzipper.on("extract", function() {

            //after zip file extracted - upload to s3
            const extractPath = path.join(__dirname, "./../temp");
            const localDirectory = extractPath + '/' + req.params.id;
            console.log('localDirectory : ' + localDirectory);

            const params = {
                localDir: localDirectory,
                deleteRemoved: true,
                s3Params: {
                    Bucket: settings.bucket,
                    Prefix: settings.bucketPath + req.params.id,
                    ACL: 'public-read'
                },
            };

            const uploader = client.uploadDir(params);
            uploader.on('error', function(err) {
                console.error("unable to sync:", err.stack);
                deleteLocalFolder(req.params.id);
            });

            uploader.on('progress', function() {
                console.log("progress", uploader.progressAmount, uploader.progressTotal);
            });
            
            uploader.on('end', function() {
                res.json({ saved: settings.bucketPath + req.params.id }).end();
                deleteLocalFolder(req.params.id);
            });
        });

        //extract the zip file into temp folder
        var extractPath = path.join(__dirname, "./../temp");
        unzipper.extract({ path: extractPath });
    } else {
        res.status(204).end();
    }


};


function deleteLocalFolder(id) {
    const extractPath = path.join(__dirname, "./../temp");
    const localDirectory = extractPath + '/' + id;
    rmdir(localDirectory, function(err) {
        if(err) console.error("unable to delete:", err);
        else console.log('folder ' + localDirectory + ' deleted successfully!')
    });
}


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
