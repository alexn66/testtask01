const bodyParser    = require("body-parser");
const express       = require("express");
const morganLogger  = require("morgan");
const rfs           = require("rotating-file-stream");
const ApiController = require("./lib/api.js");
//
const log4js        = require("log4js");
const logConfigurator = require("./configLog.js");
//
const config        = require("./config.json");



// API index



var app = express();
app.disable("x-powered-by");

// morgan logs raw http-requests in apache/nginx style
let httpRotatedLogStream = rfs("api.access.log", {
    interval: "7d",
    path: config.path + "/logs"
});
app.use(morganLogger(
    ":remote-addr :req[X-Real-IP] - [:date[iso]] \":method :url HTTP/:http-version\" :status :res[content-length] :response-time[0]ms \":user-agent\" \":referrer\" :remote-addr",
    {stream: httpRotatedLogStream, immediate: false}
));

app.use(bodyParser.json());

app.use(function(req, res, next) {
    // generate unique logging token for every incoming http-query
    res.locals.logtoken = logConfigurator.getToken();

    // set response schema
    res.locals.output = {error: "ERROR_UNKNOWN", result: null};

    next();
});




var logger = logConfigurator.getLoggerInstance(log4js, "api", config.server.api.loglevel);
let api = new ApiController(logger);

var apiRouter = express.Router();
app.use("/", apiRouter);

apiRouter.get("/", api.command_main);

apiRouter.post("/messages", api.command_create_message);
apiRouter.get( "/messages", api.command_get_messages_list);
apiRouter.get( "/messages/:mid", api.command_get_message);
apiRouter.put( "/messages/:mid", api.command_update_message);
apiRouter.delete("/messages/:mid", api.command_delete_message);




app.listen(config.server.api.port, function() {
    logger.info("testtask01 is listening on port " + config.server.api.port);
});