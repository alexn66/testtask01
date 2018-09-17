const MongoClient       = require("mongodb").MongoClient;
const MongoObjectID     = require("mongodb").ObjectID;
const Validator         = require("validator");
//
const config            = require("../config.json");



const ERROR_UNKNOWN = "ERROR_UNKNOWN";
const ERROR_ID = "ERROR_ID";
const ERROR_OFFSET = "ERROR_OFFSET";
const ERROR_LIMIT = "ERROR_LIMIT";
const ERROR_TEXT = "ERROR_TEXT";
const ERROR_NOT_FOUND = "ERROR_NOT_FOUND";


function Storage(loggerIn) {
    var logger = loggerIn;

    var mongo;
    MongoClient.connect(config.mongodb.url, { useNewUrlParser: true }, function(err, client) {
        logger.info("mongo connected successfully");
        mongo = client.db(config.mongodb.db);
        // client.close();
    });


    this.createMessage = function(header, body, logtoken) {
        validateText(header, logtoken);
        validateText(body, logtoken);

        return new Promise(function(resolve, reject) {
            mongo.collection("messages").insertOne({header, body}, function(monerr, monres) {
                if (monerr) {
                    logger.error("createMessage mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }

                logger.debug(`createMessage: message saved (${monres.insertedId})` , logtoken);
                resolve(monres.insertedId);
            });
        });
    };

    this.getMessagesList = function(offset, limit, logtoken) {
        validateOffset(offset.toString(), logtoken);
        validateLimit(limit.toString(), logtoken);

        return new Promise(function(resolve, reject) {
            mongo.collection("messages").find({}, {projection: {_id: 0, header: 1, body: 1}}).skip(offset).limit(limit).toArray(function(monerr, monres) {
                if (monerr) {
                    logger.error("getMessagesList mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }

                logger.debug(`getMessagesList: ${monres.length} messages found (offset=${offset}, limit=${limit})`, logtoken);
                resolve(monres);
            });
        });
    };

    this.getMessage = function(id, logtoken) {
        validateId(id, logtoken);

        return new Promise(function(resolve, reject) {
            mongo.collection("messages").findOne({_id: MongoObjectID(id)}, /* {projection: {_id: 0}}, */ function(monerr, monres) {
                if (monerr) {
                    logger.error("getMessage mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }

                if (monres != null) {
                    logger.debug("getMessage: message found db ok", logtoken);
                    resolve({
                        header: monres.header,
                        body: monres.body
                    });
                } else {
                    logger.info("getMessage: message not found", logtoken);
                    reject(ERROR_NOT_FOUND);
                }
            });
        });
    };

    this.updateMessage = function(id, header, body, logtoken) {
        validateId(id, logtoken);
        validateText(header, logtoken);
        validateText(body, logtoken);

        return new Promise(function(resolve, reject) {
            mongo.collection("messages").updateOne({_id: MongoObjectID(id)}, {$set: {header, body}}, function(monerr, monres) {
                if (monerr) {
                    logger.error("updateMessage mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }
                if (monres.result.ok != 1 || monres.result.nModified != 1) {
                    logger.warn("updateMessage mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }

                logger.debug("updateMessage: message updated" , logtoken);
                resolve(true);
            });
        });
    };

    this.deleteMessage = function(id, logtoken) {
        validateId(id, logtoken);

        return new Promise(function(resolve, reject) {
            mongo.collection("messages").deleteOne({_id: MongoObjectID(id)}, function(monerr, monres) {
                if (monerr) {
                    logger.error("deleteMessage mongo error: " + monerr, logtoken);
                    return reject(ERROR_UNKNOWN);
                }

                if (monres.deletedCount == 1) {
                    logger.debug("deleteMessage: message found db ok", logtoken);
                    resolve(true);
                } else {
                    logger.info("deleteMessage: message not found", logtoken);
                    reject(ERROR_NOT_FOUND);
                }
            });
        });
    };



    function validateId(id, logtoken) {
        if (!Validator.isMongoId(id)) {
            logger.warn("validateId: id doesn't match format", logtoken);
            throw ERROR_ID;
        }
    }

    function validateOffset(offset, logtoken) {
        if (!Validator.isInt(offset, {min: 0})) {
            logger.warn("validateOffset: offset doesn't match format", logtoken);
            throw ERROR_OFFSET;
        }
    }
    function validateLimit(limit, logtoken) {
        if (!Validator.isInt(limit, {min: 0, max: 1000})) {
            logger.warn("validateLimit: limit doesn't match format", logtoken);
            throw ERROR_LIMIT;
        }
    }

    function validateText(text, logtoken) {
        text = Validator.trim(text, " \n\r\t");
        text = Validator.blacklist(text, "<>");
        if (Validator.isEmpty(text)) {
            console.log(text);
            logger.warn("validateText: text doesn't match format", logtoken);
            throw ERROR_TEXT;
        }
    }
}



module.exports = {
    Storage,
    ERROR_UNKNOWN,
    ERROR_ID,
    ERROR_OFFSET,
    ERROR_LIMIT,
    ERROR_TEXT,
    ERROR_NOT_FOUND
};