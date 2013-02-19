define(["inherit"], function(inherit){

    var cid = 0,
        emptyCallback = function() {};

    var Base = inherit.Base.inherit("js.core.Base",{

        ctor: function () {
            // generate unique id
            this.$cid = ++cid;

        },

        /***
         * determinate if the application runs in the browser or on node
         *
         * @return {Boolean} true if the application runs in a browser
         */
        runsInBrowser: function () {
            return typeof window !== "undefined";
        },

        emptyCallback: function() {
            return emptyCallback;
        },

        /***
         * logs messages to configured logging functions
         *
         * @param {String|Array} message the message to log
         * @param {String} [level="info"] the service level of (debug, info, warn, error)
         */
        log: function(message, level) {
            level = level || Base.LOGLEVEL.INFO;

            if (message instanceof Error) {
                message = message.toString() + (message.stack || "");
            }

            if (Base.logger.length) {
                for (var i = 0; i < Base.logger.length; i++) {
                    Base.logger[i].log(message, level);
                }
            } else if (typeof console !== "undefined") {
                var method = (console[level] || console.log);
                if(method){
                    method.call(console,"[ " + (new Date()) + " ]: ", message);
                }
            }
        }
    });

    Base.logger = [];
    Base.LOGLEVEL = {
        DEBUG: 'debug',
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error'
    };

    return Base;
});