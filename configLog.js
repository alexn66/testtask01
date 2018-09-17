    const config        = require('./config.json');



    getTwoArgsLayout = function() {
        return function(logEvent) {
            return "["
                + logEvent.startTime.getFullYear() + '-' + ('0' + (logEvent.startTime.getMonth() + 1)).slice(-2) + '-' + ('0' + logEvent.startTime.getDate()).slice(-2) + ' '
                + ('0' + logEvent.startTime.getHours()).slice(-2) +':'+ ('0' + logEvent.startTime.getMinutes()).slice(-2) +':'+ ('0' + logEvent.startTime.getSeconds()).slice(-2) +'.'+ ('000' + logEvent.startTime.getMilliseconds()).slice(-3)
                + ('      ' + logEvent.level).slice(-6)
                + "] "
                + (logEvent.data.length > 1 && logEvent.data[1]
                    ? logEvent.data[1] + " - " + logEvent.data[0]
                    : "- " + logEvent.data[0]
                );
        };
    }


    let LogConfigurator = {
        config4driver: {
            pm2: true,
            appenders: {
                main: {
                    type    : "console",
                    layout  : {type: "twoargs"}
                }
            },
            categories: {
                default: {appenders: ['main'], level: 'INFO'}
            }
        },

        getConfig: function(loglevel) {
            const ERROR_HANDLING_MODE = loglevel || 'PRODUCTION';

            if (ERROR_HANDLING_MODE == 'DEVELOPMENT' || ERROR_HANDLING_MODE == 'ALL') {
                this.config4driver.categories.default.level = "ALL";
            }
            else if (ERROR_HANDLING_MODE == 'TRACE' || ERROR_HANDLING_MODE == 'DEBUG' || ERROR_HANDLING_MODE == 'INFO' || ERROR_HANDLING_MODE == 'WARN' || ERROR_HANDLING_MODE == 'ERROR' || ERROR_HANDLING_MODE == 'FATAL') {
                this.config4driver.categories.default.level = ERROR_HANDLING_MODE;
            }
            else // PRODUCTION
                this.config4driver.categories.default.level = "INFO";

            return this.config4driver;
        },

        getLoggerInstance: function(log4js, category, loglevel) {
            log4js.addLayout('twoargs', getTwoArgsLayout);
            log4js.configure(this.getConfig(loglevel));
            let instance = log4js.getLogger(category);

            instance.info("logger instance initialized, LOG_LEVEL=" + this.config4driver.categories.default.level);
            return instance;
        },


        getToken: function() {
            return parseInt((Math.random()).toString().slice(2)).toString(16).slice(0, 10);
        }
    }



module.exports = LogConfigurator;