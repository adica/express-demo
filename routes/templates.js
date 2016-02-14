const path = require('path');
const express = require('express');
const router = express.Router();
const s3_client = require(path.join(__dirname, '../s3/index.js'));

router.get('/', (req, res, next) => {
    s3_client.list(req, res, next);
});

router.get('/:id', (req, res, next) => {
    s3_client.getById(req, res, next);  
});


router.post('/', (req, res, next) => {
    s3_client.post(req, res, next);
});

router.put('/:id', (req, res, next) => {
    s3_client.put(req, res, next);
});

router.delete('/:id', (req, res, next) => {
    s3_client.del(req, res, next);
});

module.exports = router;
