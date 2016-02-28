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

//post
exports.post = function(req, res, next) {
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
};



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
