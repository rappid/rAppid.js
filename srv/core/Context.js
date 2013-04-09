define(['js/core/EventDispatcher', 'url', 'querystring', 'underscore', 'flow', 'srv/core/Identity', 'js/core/Base'],
    function (EventDispatcher, Url, QueryString, _, flow, Identity, Base) {

        var undefined,
            Context = EventDispatcher.inherit('srv.core.Context', {

                $hooks: ["beginRequest", "beforeHeadersSend", "endRequest"],

                ctor: function (server, endPoint, request, response) {

                    this.$processingHooks = {};

                    this.server = server;
                    this.identity = new Identity(this, server);

                    this.endPoint = endPoint;
                    this.request = request;
                    this.response = response;

                    this._registerFilterHooks(server.$filters);

                    this._subClassResponse(response);

                    this._parseUrl(request, endPoint);
                    this._parsePostData(request);

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

                _registerFilterHooks: function (filters) {
                    // register filter hooks
                    for (var i = 0; i < this.$hooks.length; i++) {
                        var hookName = this.$hooks[i];
                        this.addProcessingHook(hookName, filters[hookName].bind(filters));
                    }
                },

                _subClassResponse: function (response) {

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

                _parseUrl: function (request, endpoint) {

                    var urlInfo = Url.parse(request.url);
                    request.urlInfo = urlInfo;
                    urlInfo.parameter = QueryString.parse(urlInfo.query);
                    request.get = urlInfo;

                    var host = request.headers.host;
                    var baseUri = endpoint.protocol + "://" + host;

                    request.urlInfo.baseUri = baseUri;
                    request.urlInfo.uri = baseUri + request.urlInfo.pathname;

                },

                _parsePostData: function (request) {

                    if (request.method === "POST") {
                        try {
                            request.post = QueryString.parse(request.body.content);
                        } catch (e) {
                            this.log("Couldn't parse post parameters", "info");
                        }
                    }

                    if (!request.post) {
                        request.post = {};
                    }

                },

                _extractCookies: function (request) {

                    var cookies = request.headers.cookie;
                    request.cookie = {};

                    if (!cookies) {
                        return;
                    }

                    cookies.split(";").forEach(function (cookie) {
                        var parts = cookie.split('=');
                        request.cookie[parts[0].trim()] = (parts[1] || "").trim();
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
                if (this.$end) {
                    return false;
                }

                this.$end = true;

                var self = this;
                this.$context._executeHook("endRequest", function () {
                    self.__end.call(self);
                });
            },

            _writeHead: function (statusCode, reasonPhrase, headers) {
                if (this.$headersSent) {
                    throw new Error("Headers already sent.");
                }

                var args = Array.prototype.slice.call(arguments);

                if (args.length === 3) {
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
                            .exec(function () {
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

            ctor: function (context) {
                this.cookie = {};
                var self = this;
                context.addProcessingHook("beforeHeadersSend", function (context, callback) {
                    self._writeCookiesToHead(context, callback);
                });
            },

            set: function (name, value, options) {
                this.cookie[name] = new Context.CookieManager.Cookie(name, value, options);
            },

            remove: function (name) {
                this.set(name);
            },

            _writeCookiesToHead: function (context, callback) {

                var headers = [];

                for (var key in this.cookie) {
                    if (this.cookie.hasOwnProperty(key)) {
                        headers.push(this.cookie[key].toHeader());
                    }
                }

                context.response.setHeader("Set-Cookie", headers);
                callback();
            }
        });

        Context.CookieManager.Cookie = Base.inherit('srv.core.Context.CookieManager.Cookie', {

            ctor: function (name, value, options) {

                options = options || {};
                _.defaults(options, {
                    path: "/",
                    expires: undefined,
                    domain: undefined,
                    httpOnly: true,
                    secure: false,

                    value: value,
                    name: name
                });

                this.$ = options;

            },

            toString: function () {
                return this.$.name + "=" + this.$.value;
            },

            toHeader: function () {
                var header = this.toString();

                if (this.$.path) {
                    header += "; path=" + this.$.path;
                }

                if (this.$.value === undefined) {
                    // undefined value -> remove cookie
                    this.$.expires = new Date(0);
                }

                if (this.$.expires) {
                    header += "; expires=" + this.$.expires.toUTCString();
                }

                if (this.$.domain) {
                    header += "; domain=" + this.$.domain;
                }

                if (this.$.secure) {
                    header += "; secure";
                }

                if (this.httpOnly) {
                    header += "; httponly";
                }

                return header;
            }

        });

        return Context;
    });