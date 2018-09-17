const Storage           = require("./storage.js");



function ApiController(logger) {

    var storage = new Storage.Storage(logger);



    this.command_main = function(req, res) {
        logger.info("REQ IN  [ / ]: main page requested\n");
        res.end("intro page");
    };



    this.command_create_message = async function(req, res) {
        let logtoken = logRequest("command_create_message", req, res);
        let mheader = req.body.mheader || "";
        let mbody = req.body.mbody || "";

        try {
            let mid = await storage.createMessage(mheader, mbody, logtoken);

            logger.info(`create message ok (${mid})`, logtoken);
            res.locals.output.error = 0;
            res.locals.output.result = mid;
        } catch(ex) {
            (ex.name === undefined)
                ? res.locals.output.error = ex
                : logger.error("unexpected error "+ex+"\n"+ex.stack, logtoken);
        }

        logOutputAndRespond("command_create_message", res, logtoken);
    };



    this.command_get_messages_list = async function(req, res) {
        let logtoken = logRequest("command_get_messages_list", req, res);
        let offset = req.body.offset || 0;
        let limit = req.body.limit || 100;

        try {
            let list = await storage.getMessagesList(offset, limit, logtoken);

            logger.info("get messages list ok", logtoken);
            res.locals.output.error = 0;
            res.locals.output.result = list;
        } catch(ex) {
            (ex.name === undefined)
                ? res.locals.output.error = ex
                : logger.error("unexpected error "+ex+"\n"+ex.stack, logtoken);
        }

        logOutputAndRespond("command_get_messages_list", res, logtoken);
    };



    this.command_get_message = async function(req, res) {
        let logtoken = logRequest("command_get_message", req, res);
        let mid = req.params.mid || "";

        try {
            let message = await storage.getMessage(mid, logtoken);

            logger.info(`get message ok - ${mid} (${message.header}: ${message.body})`, logtoken);
            res.locals.output.error = 0;
            res.locals.output.result = [{header: message.header, body: message.body}];
        } catch(ex) {
            (ex.name === undefined)
                ? res.locals.output.error = ex
                : logger.error("unexpected error "+ex+"\n"+ex.stack, logtoken);
        }

        logOutputAndRespond("command_get_message", res, logtoken);
    };



    this.command_update_message = async function(req, res) {
        let logtoken = logRequest("command_update_message", req, res);
        let mid = req.params.mid || "";
        let mheader = req.body.mheader || "";
        let mbody = req.body.mbody || "";

        try {
            await storage.getMessage(mid, logtoken);
            await storage.updateMessage(mid, mheader, mbody, logtoken);

            logger.info("update message ok - " + mid, logtoken);
            res.locals.output.error = 0;
            res.locals.output.result = "ok";
        } catch(ex) {
            (ex.name === undefined)
                ? res.locals.output.error = ex
                : logger.error("unexpected error "+ex+"\n"+ex.stack, logtoken);
        }

        logOutputAndRespond("command_update_message", res, logtoken);
    };



    this.command_delete_message = async function(req, res) {
        let logtoken = logRequest("command_delete_message", req, res);
        let mid = req.params.mid || "";

        try {
            await storage.deleteMessage(mid, logtoken);

            logger.info("delete message ok - " + mid, logtoken);
            res.locals.output.error = 0;
            res.locals.output.result = "ok";
        } catch(ex) {
            (ex.name === undefined)
                ? res.locals.output.error = ex
                : logger.error("unexpected error "+ex+"\n"+ex.stack, logtoken);
        }

        logOutputAndRespond("command_delete_message", res, logtoken);
    };









    function logRequest(commandname, req, res) {
        let arr = [];
        for (let i in req.body)
            arr.push(i + "=" + req.body[i]);
        logger.info("REQ IN  [" + commandname + "]: " + arr.join(", "), res.locals.logtoken);
        return res.locals.logtoken;
    }

    function logOutputAndRespond(commandname, res, logtoken) {
        logger.info("REQ OUT [" + commandname + "]: " + JSON.stringify(res.locals.output) + "\n", logtoken);
        res.json(res.locals.output);
    }
}



module.exports = ApiController;