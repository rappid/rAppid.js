define(["inherit"], function(inherit){

    var cid = 0,
        emptyCallback = function() {},
        NONE = 0,
        LOADING = 1,
        LOADED = 2,
        ERROR = 3;

    var Base = inherit.Base.inherit("js.core.Base",{

        ctor: function () {
            this.$debounceTimeoutMap = {};

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

        /***
         * this is an empty function doing nothing. It can be used as fallback if a method requires a
         * callback function, which hasn't been passed.
         *
         * ```
         *  function myFunction(callback) {
         *      callback = callback || this.emptyCallback;
         *  }
         * ```
         *
         * @returns {Function} a function doing nothing
         */
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
                    try {
                        method.call(console, "[ " + (new Date()) + " ]: ", message);
                    } catch (e) {
                        // nothing to do here
                    }
                }
            }
        },

        /***
         *
         * @param {Function} fnc
         * @param {String} [cacheId]
         * @param {Number} [delay]
         * @param {Object} [scope]
         * @param {Array} [parameters]
         * @param {String} [strategy=loop] - loop will trigger the function at least every delay, wait will clear the timeout
         * @private
         */
        _debounceFunctionCall: function(fnc, cacheId, delay, scope, parameters, strategy) {
            var self = this,
                LOOP = "loop";

            if (!fnc) {
                return;
            }

            cacheId = cacheId || fnc.toString();
            scope = scope || this;
            parameters = parameters || [];
            strategy = strategy || LOOP;

            if (delay === 0) {
                // immediately invoke function
                fnc.apply(scope, parameters);
                return;
            }

            delay = delay || 300;
            if (this.$debounceTimeoutMap[cacheId]) {
                // timer registered

                if (strategy === LOOP) {
                    return;
                }

                clearTimeout(this.$debounceTimeoutMap[cacheId]);
            }

            this.$debounceTimeoutMap[cacheId] = setTimeout(function() {
                delete self.$debounceTimeoutMap[cacheId];
                fnc.apply(scope, parameters);
            }, delay);
        },
        /**
         *
         * @param fnc - the function to synchronize
         * @param cacheId - the cacheId for the fnc call
         * @param callback - the callback to be called in the fnc
         * @param scope - the fnc scope
         * @param clear  - if you want to clear the cache after all callbacks are called
         */
        synchronizeFunctionCall: function (fnc, cacheId, callback, scope, clear) {

            var self = this;

            this.$synchronizeCache = this.$synchronizeCache || {};
            var obj = this.$synchronizeCache[cacheId] = this.$synchronizeCache[cacheId] || {
                state: 0,
                result: null,
                error: null,
                callbacks: []
            };

            if (obj.state === LOADED) {
                callback && callback(obj.error, obj.result);
            } else if (obj.state === LOADING) {
                callback && obj.callbacks.push(callback);
            } else {
                callback && obj.callbacks.push(callback);
                obj.state = LOADING;
                fnc.call(scope, function(err, result) {
                    if (clear) {
                        delete self.$synchronizeCache[cacheId];
                    }

                    obj.state = err ? ERROR : LOADED;
                    obj.error = err;
                    obj.result = result;

                    for (var i = 0; i < obj.callbacks.length; i++) {
                        try {
                            obj.callbacks[i](err, result);
                        } catch (e) {
                            self.log(e, Base.LOGLEVEL.ERROR);
                        }
                    }

                    obj.callbacks = [];
                });
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