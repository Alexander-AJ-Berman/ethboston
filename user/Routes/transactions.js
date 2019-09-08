const transactionRouter = require('express').Router();
const reqIsMissingParams = require('../../util/reqIsMissingParams');
const { authenticate } = require('../../middleware/authenticate');
const { buildTransaction } = require('./helpers/send/buildTransaction');
const axios = require('axios');

transactionRouter.post('/buildTx', authenticate, async (req, res) => {
    const requiredParams = ['chain', 'txInfo'];
    if (reqIsMissingParams(req, res, requiredParams)) return;

    const trnResponse = await buildTransaction(req.body.chain, req.body.txInfo);
    if (!trnResponse.success) {
        res.status(401).send("Transaction creation failed!");
        return;
    }
    res.status(200).send({transaction: trnResponse.transaction})
});

transactionRouter.post('/signTx', authenticate, async(req, res) => {
    const requiredParams = ['transaction', 'path'];
    if (reqIsMissingParams(req,res, requiredParams)) return;
    let data = {
        uuid: req.session.uuid,
        transaction: req.body.transaction,
        path: req.body.path
    }
    try {
        const txResponse = await axios.post('http://localhost:3001/custody/signTx', data);
        if (!txResponse.data.success) {
            res.status(401).send({success: false, transaction: ''});
        } else {
            console.log(txResponse.data);
            res.status(200).send({success: true, transaction: txResponse.data.transaction});
        }
    } catch (err) {
        console.log(err);
        res.status(400).send("failed");
    }    
});

module.exports = { transactionRouter }