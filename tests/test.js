const MongoClient   = require("mongodb").MongoClient;
const MongoObjectID = require("mongodb").ObjectID;
const assert        = require('chai').assert;
const syncreq       = require('sync-request');
//
const config        = require('../config.json');




describe('testtesk01', function() {
    var mongoclient, mongo;


    before(async function() {
        await new Promise(function(resolve, reject) {
            MongoClient.connect(config.mongodb.url, { useNewUrlParser: true }, function(monerr, client) {
                if (monerr) reject(monerr);

                mongoclient = client;
                mongo = mongoclient.db(config.mongodb.db);
                resolve();
            });
        });

        // delete all unit-messages from previous tests
        await new Promise(function(resolve, reject) {
            mongo.collection('messages').deleteMany({header: /^unit/}, function(monerr, monres) {
                if (monerr) reject(monerr);

                resolve();
            });
        });
    });
    after(function(done) {
        mongoclient.close(() => {
            done();
        });
    });



    // + before: remove all messages from previous test runs
    // + make insert of message 1
    // + make insert of message 2
    // + check db: there are both messages with these exact ids
    // + get message 1
    // + get message 2
    // +-get list: ok ?????????
    // + update message 1 - ensure it has new values in db
    // + delete message 2 - ensure it is not db anymore



    describe('MainCaseSet', function() {
        let res, resdata;
        let mid1, mid2;


        it('make insertion #1', function() {
            res = syncreq('POST', `${config.server.api.host}:${config.server.api.port}/messages`, {
                json: {mheader: 'unit header 1', mbody: 'unit body 1'}
            });
            resdata = res.body.toString('utf8');

            assert.match(resdata, /\{"error":0,"result":"[0-9a-f]{24}"\}/);

            resdata = JSON.parse(resdata);
            mid1 = resdata.result;
        });

        it('make insertion #2', function() {
            res = syncreq('POST', `${config.server.api.host}:${config.server.api.port}/messages`, {
                json: {mheader: 'unit header 2', mbody: 'unit body 2'}
            });
            resdata = res.body.toString('utf8');

            assert.match(resdata, /\{"error":0,"result":"[0-9a-f]{24}"\}/);

            resdata = JSON.parse(resdata);
            mid2 = resdata.result;
        });

        it('make sure both inserted messages are in db', function(done) {
            mongo.collection("messages").find({header: /^unit/}).toArray(function(monerr, monres) {
                if (monerr) throw monerr;

                // exact two messages
                assert.equal(2, monres.length);
                // of exact ids
                for (let m of monres)
                    assert.include([mid1, mid2], m._id.toString());

                done();
            });
        });


        it('get message 1', function() {
            res = syncreq('GET', `${config.server.api.host}:${config.server.api.port}/messages/${mid1}`);
            resdata = res.body.toString('utf8');

            assert.equal(resdata, '{"error":0,"result":[{"header":"unit header 1","body":"unit body 1"}]}');
        });

        it('get message 2', function() {
            res = syncreq('GET', `${config.server.api.host}:${config.server.api.port}/messages/${mid2}`);
            resdata = res.body.toString('utf8');

            assert.equal(resdata, '{"error":0,"result":[{"header":"unit header 2","body":"unit body 2"}]}');
        });

        it('get list', function() {
            res = syncreq('GET', `${config.server.api.host}:${config.server.api.port}/messages`);
            resdata = JSON.parse(res.body.toString('utf8'));

            assert.equal(0, resdata.error);
        });


        it('update first', function(done) {
            res = syncreq('PUT', `${config.server.api.host}:${config.server.api.port}/messages/${mid1}`, {
                json: {mheader: 'unit header 1 UPD', mbody: 'unit body 1 UPD'}
            });
            resdata = res.body.toString('utf8');
            assert.equal('{"error":0,"result":"ok"}', resdata);

            mongo.collection("messages").findOne({_id: new MongoObjectID(mid1)}, function(monerr, monres) {
                if (monerr) throw monerr;

                assert.equal('unit header 1 UPD', monres.header);
                assert.equal('unit body 1 UPD', monres.body);
                done();
            });
        });

        it('remove second', function(done) {
            res = syncreq('DELETE', `${config.server.api.host}:${config.server.api.port}/messages/${mid2}`);
            resdata = res.body.toString('utf8');
            assert.equal('{"error":0,"result":"ok"}', resdata);

            mongo.collection("messages").findOne({_id: new MongoObjectID(mid2)}, function(monerr, monres) {
                if (monerr) throw monerr;

                assert.strictEqual(null, monres); // not found
                done();
            });
        });
    });
});