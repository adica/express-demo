const settings = require('./s3/settings.json');
var path     = require("path");
var express  = require("express");
var multer   = require("multer");
var Unzipper = require("decompress-zip");


var app = express();

app.use(multer({dest:'./uploads/'}).single('templatezip'));


app.post("/", function(req, res){

    if (req.file){

        var filepath = path.join(req.file.destination, req.file.filename);
        var unzipper = new Unzipper(filepath);

        unzipper.on("extract", function () {
            console.log("Finished extracting");
        });

        var extractPath = path.join(__dirname, "/temp");
        unzipper.extract({ path: extractPath});
    }

    res.status(204).end();
});


app.listen(3000);