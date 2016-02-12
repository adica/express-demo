'use strict';
const path = require('path');
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
exports.list = function (req, res, next) {    
    aws.list({
        prefix: settings.bucketPath
    }, function(err, data) {        
      if(err){
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
            console.log('resp.statusCode: ', resp.statusCode);
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
}


//------        put         ------//
/*const object = { foo: "bar" };
const string = JSON.stringify(object);
const req = aws.put(settings.bucketPath + 'obj.json', {
    'Content-Length': Buffer.byteLength(string)
  , 'Content-Type': 'application/json'
  , 'x-amz-acl': 'public-read' 
});
req.on('response', function(res){
  if (200 == res.statusCode) {
    console.log('saved to %s', req.url);
  }
});
req.end(string);*/
//------     end of put     ------//

//------        delete         ------//
/*aws.del(settings.bucketPath + 'obj.json').on('response', function(res){
  console.log(res.statusCode);
  console.log(res.headers);
}).end();*/
//------     end of delete     ------//


/*module.exports = {
    list: listObject,
    get: getObject
}*/
