define(['js/core/EventDispatcher', 'url', 'querystring', 'underscore', 'flow', 'srv/core/User', 'js/core/Base'],
    function (EventDispatcher, Url, QueryString, _, flow, User, Base) {

        var Context = EventDispatcher.inherit('srv.core.Context', {

            $hooks: ["beginRequest", "beforeHeadersSend", "endRequest"],

            ctor: function (server, endPoint, request, response) {

                this.$processingHooks = {};

                this.server = server;
                this.session = new server.$serverSessionFactory();
                this.user = new User.AnonymousUser();

                this.endPoint = endPoint;
                this.request = request;
                this.response = response;

                this._registerFilterHooks(server.$filters);

                this._subClassResponse(response);


                this._parseUrl();

                this._extractCookies(request);

                response.cookies = new Context.CookieManager(this);

            },

            /***
             *
             * @param name
             * @param {Function} hookFunction
             */
            addProcessingHook: function (name, hookFunction) {
                var processingHookStorage = this.$processingHooks[name] || (this.$processingHooks[name] = []);
                processingHookStorage.push(hookFunction);
            },

            _executeHook: function (name, callback) {
                var context = this;

                flow()
                    .seqEach(this.$processingHooks[name], function (hookFunction, cb) {
                        hookFunction(context, cb);
                    })
                    .exec(callback);
            },

            _registerFilterHooks: function(filters) {
                // register filter hooks
                for (var i = 0; i < this.$hooks.length; i++) {
                    var hookName = this.$hooks[i];
                    this.addProcessingHook(hookName, filters[hookName].bind(filters));
                }
            },

            _subClassResponse: function(response) {

                response.__end = response.end;
                response.__writeHead = response.writeHead;
                response.__write = response.write;

                response.$context = this;

                if (!response.__proto__.getHeaders) {
                    response.__proto__.getHeaders = function () {
                        return this._renderHeaders();
                    };
                }

                response.writeHead = Context.Response._writeHead;

                response.write = Context.Response._write;

                response.end = Context.Response._end;
            },

            _parseUrl: function() {
                var request = this.request;

                var urlInfo = Url.parse(request.url);
                request.urlInfo = urlInfo;
                urlInfo.parameter = QueryString.parse(urlInfo.query);
            },

            _extractCookies: function(request) {

                var cookies = request.headers["cookie"];
                request.cookies = {};

                if (!cookies) {
                    return;
                }

                cookies.split(";").forEach(function (cookie) {
                    var parts = cookie.split('=');
                    request.cookies[parts[0].trim()] = (parts[1] || "").trim();
                });

            }

        });

        Context.Response = {

            _write: function (chunk, encoding) {
                var self = this;
                Context.Response._writeHeadHook.call(this, function () {
                    self.__write.call(self, chunk, encoding);
                });
            },

            _end: function () {
                if (this.finished) {
                    return false;
                }

                var self = this;
                this.$context._executeHook("endRequest", function () {
                    self.__end.call(self);
                });
            },

            _writeHead: function (statusCode, reasonPhrase, headers) {
                if (this.$headersSent) {
                    throw new Error("Headers already sent.");
                }

                if (typeof arguments[1] == 'string') {
                    this.$reasonPhrase = arguments[1];
                } else {
                    headers = reasonPhrase;
                }

                if (headers) {
                    for (var key in headers) {
                        if (headers.hasOwnProperty(key)) {
                            this.setHeader(key, headers[key]);
                        }
                    }
                }

                this.statusCode = statusCode;
                Context.Response._writeHeadHook.call(this);
            },

            _writeHeadHook: function (callback) {
                // internal write head logic

                    var self = this;

                    if (!this.$headersSent) {
                        if (this.$writeHeadCallbacks) {
                            // head write in process -> queue callback
                            this.$writeHeadCallbacks.push(callback);
                        } else {
                            this.$writeHeadCallbacks = [callback];

                            flow()
                                .seq(function (cb) {
                                    self.$context._executeHook("beforeHeadersSend", cb);
                                })
                                .exec(function (err) {
                                    // TODO: how to handle errors here ?
                                    self.__writeHead.call(self, self.statusCode, self.$reasonPhrase);
                                    self.$headersSent = true;

                                    for (var i = 0; i < self.$writeHeadCallbacks.length; i++) {
                                        var writeHeadCallback = self.$writeHeadCallbacks[i];
                                        writeHeadCallback && writeHeadCallback();
                                    }
                                });
                        }
                    } else {
                        callback();
                    }
            }

        };

        Context.CookieManager = Base.inherit('srv.core.Context.CookieManager', {

            ctor: function(context) {
                this.cookies = {};
                var self = this;
                context.addProcessingHook("beforeHeadersSend", function(context, callback) {
                    self._writeCookiesToHead(context, callback);
                });
            },

            set: function(name, value, options) {
                this.cookies[name] = new Context.CookieManager.Cookie(name, value, options)
            },

            remove: function(name) {
                this.set(name);
            },

            _writeCookiesToHead: function(context, callback) {

                var headers = [];

                for (var key in this.cookies) {
                    if (this.cookies.hasOwnProperty(key)) {
                        headers.push(this.cookies[key].toHeader())
                    }
                }

                context.response.setHeader("Set-Cookie", headers);
                callback();
            }
        });

        Context.CookieManager.Cookie = Base.inherit('srv.core.Context.CookieManager.Cookie', {

            path: "/",
            expires: undefined,
            domain: undefined,
            httpOnly: true,
            secure: false,

            ctor: function (name, value, options) {
                this.name = name;
                this.value = value;

                options = options || {};

                this.expires = options.expires;
                // TODO: handle options
            },

            toString: function () {
                return this.name + "=" + this.value
            },

            toHeader: function () {
                var header = this.toString();

                if (this.path) {
                    header += "; path=" + this.path
                }

                if (this.expires) {
                    header += "; expires=" + this.expires.toUTCString();
                }

                if (this.domain) {
                    header += "; domain=" + this.domain;
                }

                if (this.secure) {
                    header += "; secure";
                }

                if (this.httpOnly) {
                    header += "; httponly";
                }

                return header
            }

        });

        return Context;
    });