const path = require('path');
const settings = require('./settings.json');
const Promise = require('promise');
const knox = require('knox');
const aws = knox.createClient({
    key: settings.key,
    secret: settings.secret,
    bucket: settings.bucket
});

//------        list         ------//
function listObject() {
    aws.list({
        prefix: settings.bucketPath
    }, function(err, resp) {
      return resp;     
    });
}

//------     end of list     ------//


//------       get         ------//
function getObject(id) {
    console.log('id: ' + id);


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
}
//------     end of get     ------//

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


module.exports = {
    list: listObject,
    get: getObject
}
