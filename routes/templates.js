const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();
const s3_client = require('./../s3/index.js');
const settings = require('./../s3/settings.json');
const knox = require('knox');

const aws = knox.createClient({
    key: process.env.AWS_ACESS,
    secret: process.env.AWS_SECRET,
    bucket: settings.bucket
});


router.get('/', (req, res, next) => {
    s3_client.list(req, res, next);
});

router.get('/:id', (req, res, next) => {
    s3_client.getById(req, res, next);  
});


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
