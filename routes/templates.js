const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const s3_client = require('./../s3/index.js');
const settings = require('./../s3/settings.json');
const knox = require('knox');

const aws = knox.createClient({
    key: settings.key,
    secret: settings.secret,
    bucket: settings.bucket
});


router.get('/', (req, res, next) => {
    aws.list({
        prefix: settings.bucketPath
    }, function(err, data) {
        if (err) throw Error(err)
        res.json(data);
    });
});

router.get('/:id', (req, res, next) => {
    //TODO auth
    /*if (!req.user.is.authenticated) {
        var err = new Error()
        err.status = 403
        next(err)
        return
      }*/
    aws.get(settings.bucketPath + req.params.id + '/template.config')
        .on('error', function(err) {
            console.log('error: ' + err);
            return
        })
        .on('response', function(resp) {
            if (resp.statusCode !== 200) {
                var err = new Error()
                err.status = 404
                next(err)
                return
            }

            res.setHeader('Content-Length', resp.headers['content-length'])
            res.setHeader('Content-Type', resp.headers['content-type'])

            // cache-control?
            // etag?
            // last-modified?
            // expires?

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
})


router.post('/', (req, res, next) => {
    var tempFile = path.join('./temp/', 'test-template.json');

    fs.stat(tempFile, function(err, stat) {
        if (err) throw Error(err)

        var req = aws.put(settings.bucketPath + 'test-template.json', {
            'Content-Length': stat.size,
            'Content-Type': 'application/json',
            'x-amz-acl': 'public-read'
        });

        fs.createReadStream(tempFile).pipe(req);

        req.on('response', function(resp) {
            resp.pipe(res);
        });
    });
});

router.put('/:id', (req, res, next) => {
    aws.get(settings.bucketPath + req.params.id).on('response', function(res) {        
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
           // console.log(chunk);
        });
        res.on('end', function () {
            console.log('resp : ' +JSON.parse(res));
        })

    }).end();
});

router.delete('/:id', (req, res, next) => {
   res.json({"not" : "implemented"});
});

module.exports = router;
