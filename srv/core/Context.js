define(['js/core/EventDispatcher', 'url', 'querystring', 'underscore', 'srv/core/ServerSession', 'srv/core/User'],
    function (EventDispatcher, Url, QueryString, _, ServerSession, User) {

        var Context = EventDispatcher.inherit('srv.core.Context', {

            ctor: function (server, endPoint, request, response) {
                this.server = server;
                this.session = new ServerSession();
                this.user = new User.AnonymousUser();
                this.endPoint = endPoint;
                this.request = request;
                this.response = response;

                this._subClassResponse();

                this._parseUrl();

                this._extractCookies();

                this.response.cookies = new Context.Cookie(response);

            },

            _subClassResponse: function() {
                var server = this.server,
                    response = this.response,
                    context = server.context,
                    _writeHead = response.writeHead,
                    _end = response.end,
                    _write = response.write;

                if (!response.__proto__._writeHeadHook) {
                    // internal write head logic

                    response.__proto__._writeHeadHook = function (callback) {
                        var self = this;

                        if (!this.$headersSent) {
                            if (this.$writeHeadCallbacks) {
                                // head write in process -> queue callback
                                this.$writeHeadCallbacks.push(callback);
                            } else {
                                this.$writeHeadCallbacks = [callback];
                                server.$filters.beforeHeadersSend(context, function () {
                                    _writeHead.call(self, self.statusCode, self.$reasonPhrase);
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
                    };
                }

                if (!response.__proto__.getHeaders) {
                    response.__proto__.getHeaders = function () {
                        return this._renderHeaders();
                    }
                }

                response.writeHead = function (statusCode, reasonPhrase, headers) {
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
                    this._writeHeadHook();
                };

                response.write = function (chunk, encoding) {
                    var self = this;
                    this._writeHeadHook(function () {
                        _write.call(self, chunk, encoding);
                    });
                };

                response.end = function () {
                    if (this.finished) {
                        return false;
                    }
                    var self = this;
                    server.$filters.endRequest(context, function () {
                        _end.call(self);
                    });
                };
            },

            _parseUrl: function() {
                var request = this.request;

                var urlInfo = Url.parse(request.url);
                request.urlInfo = urlInfo;
                urlInfo.parameter = QueryString.parse(urlInfo.query);
            },

            _extractCookies: function() {
                var cookies = this.request.headers["cookie"];

                if (!cookies) {
                    return;
                }

            }

        });

        Context.Cookie = Base.inherit({

        });

        return Context;
    });