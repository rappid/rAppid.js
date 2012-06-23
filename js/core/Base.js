define(["inherit"], function(inherit){

    var cid = 0;

    var Base = inherit.Base.inherit("js.core.Base",{

        ctor: function () {
            // generate unique id
            this.$cid = ++cid;

        },

        runsInBrowser: function () {
            return typeof window !== "undefined";
        },

        /***
         *
         * @param {String|Array} message
         * @param {String} [level="info"]
         */
        log: function(message, level) {
            level = level || Base.LOGLEVEL.INFO;

            if (message instanceof Error) {
                message = message.toString();
            }

            if (Base.logger.length) {
                for (var i = 0; i < Base.logger.length; i++) {
                    Base.logger[i].log(message, level);
                }
            } else if (typeof console !== "undefined") {
                (console[level] || console.log).call(console, message);
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