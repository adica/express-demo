var express = require('express');
var router = express.Router();



const DataStore = require('nedb');
const db = new DataStore({filename : 'temp/users.db',autoload : true});

router.get('/', (req, res, next) => {
    db.find({}, (err, docs) => {
        if (err) throw Error(err)
        res.json(docs)
    });
});

router.get('/:id', (req, res, next) => {
    db.find({_id: req.params.id}, {}, (err, docs) => {
        if (err) throw Error(err)
        res.json(docs)
    });
});

router.post('/', (req, res, next) => {
    db.insert(req.body, (err, doc) => {
        if (err) throw Error(err)
        res.json(doc)
    });
});

router.put('/:id', (req, res, next) => {
    db.update({_id: req.params.id}, req.body, {}, (err, doc) => {
        if (err) throw Error(err)
        res.json(doc)
    });
});

router.delete('/:id', (req, res, next) => {
    db.remove({_id: req.params.id}, {}, (err, doc) => {
        if (err) throw Error(err)
        res.json(doc)
    });
});

module.exports = router;