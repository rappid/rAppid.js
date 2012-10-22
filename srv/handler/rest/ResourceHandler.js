define(['js/core/Component', 'srv/core/HttpError', 'flow', 'require', 'JSON', 'js/data/Collection', 'js/data/DataSource'], function (Component, HttpError, flow, require, JSON, Collection, DataSource) {

    return Component.inherit('srv.handler.rest.ResourceHandler', {
        defaults: {
            autoStartSession: true
        },
        $collectionMethodMap: {
            GET: "_index",
            POST: "_create"
        },

        $modelMethodMap: {
            GET: "_show",
            PUT: "_update",
            DELETE: "_delete"
        },

        init: function (restHandler, configuration, resourceId, parentResource) {
            this.$restHandler = restHandler;
            this.$resourceId = resourceId;

            this.$resourceConfiguration = configuration;
            this.$parentResource = parentResource;
        },

        _isCollectionResource: function () {
            return !this.$resourceId;
        },

        getResourceHandlerInstance: function() {
            return this;
        },

        getDataSource: function (context, childResource) {
            if (this.$parentResource) {
                return this.$parentResource.getDataSource(context, this);
            } else {
                return this.$restHandler.getDataSource(context, this);
            }
        },

        handleRequest: function (context, callback) {

            var self = this,
                method = this._getRequestMethod(context),
                map = this._isCollectionResource() ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];

            if (fn instanceof Function) {
                context.dataSource = this.getDataSource(context);
                var body = context.request.body.content;

                if (body !== "") {
                    // TODO: handle different payload formats -> format processor needed
                    try {
                        context.request.params = JSON.parse(body);
                    } catch (e) {
                        console.warn("Couldn't parse " + body);
                    }
                }
                // TODO: better apply json post value here to the function
                fn.call(self, context, callback);

            } else {
                throw new HttpError("Method not supported", 404);
            }
        },

        _findCollection: function (context) {
            if (this.$parentResource) {
                // TODO: refactor this
                var parentFactory = this.$parentResource._getModelFactory();
                var parent = context.dataSource.createEntity(parentFactory, this.$parentResource.$resourceId);

                return parent.getCollection(this.$resourceConfiguration.$.path);
            } else {
                return context.dataSource.createCollection(Collection.of(this._getModelFactory()));
            }
        },

        /***
         * determinate the request method from the request
         *
         * @param {srv.core.Context} context
         * @return {String} method
         * @private
         */
        _getRequestMethod: function (context) {

            var parameter = context.request.urlInfo.parameter;
            if (parameter.method) {
                return parameter.method.toUpperCase();
            }

            return context.request.method;
        },

        _getModelFactory: function () {
            return require(this.$resourceConfiguration.$.modelClassName.replace(/\./g, '/'));
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _index: function (context, callback) {
            var collection = this._findCollection(context);

            var parameters = context.request.urlInfo.parameter;
            var options = {};
            if (parameters["limit"]) {
                options["limit"] = parseInt(parameters["limit"]);
            }
            var self = this;
            // TODO: read out offset, limit and query from query string
            collection.fetch(options, function (err, collection) {
                if (!err) {
                    var response = context.response;
                    var body = "", results = [];

                    // switch context of collection to restdatasource

                    // call compose
                    var processor = self.$restHandler.$restDataSource.getProcessorForCollection(collection);

                    results = processor.composeCollection(collection, null, options);

                    var res = {
                        count: collection.$itemsCount,
                        limit: options["limit"],
                        offset: 0,
                        results: results
                    };

                    body = JSON.stringify(res);

                    response.writeHead(200, "", {
                        'Content-Type': 'application/json; charset=utf-8'
                    });

                    response.write(body, 'utf8');
                    response.end();
                }


                callback(err);
            });
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _create: function (context, callback) {
            var collection = this._findCollection(context);
            var model = collection.createItem();

            var payload = context.request.params;

            var processor = this.$restHandler.$restDataSource.getProcessorForModel(model);

            model.set(processor.parse(model, payload));

            model.set('created', new Date());

            // TODO: add hook to add session data like user id
            flow()
                .seq(function (cb) {
                    model.validate(function(err) {
                        cb(err);
                    });
                })
                .seq(function (cb) {
                    // TODO: add sub models
                    model.save({}, function (err, model) {
                        if (!err) {
                            // TODO: do correct invalidation
                            collection.invalidatePageCache();

                            // TODO: generate the location header
                            var body = "";

                            var response = context.response;
                            response.writeHead(201, "", {
                                'Content-Type': 'application/json',
                                'Location': 'http://todo' + context.request.url + "/" + model.$.id
                            });

                            response.write(body);
                            response.end();

                            cb(null);
                        } else {
                            cb(new HttpError(err, 500));
                        }
                    });
                }).exec(callback);
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _show: function (context, callback) {
            var modelFactory = this._getModelFactory();
            var model = context.dataSource.createEntity(modelFactory, this.$resourceId);
            var self = this;

            // TODO: add fields/include option handling
            model.fetch({}, function (err, model) {
                if (!err) {
                    var processor = self.$restHandler.$restDataSource.getProcessorForModel(model);

                    var body = JSON.stringify(processor.compose(model, null)),
                        response = context.response;

                    response.writeHead(200, "", {
                        'Content-Length': body.length,
                        'Content-Type': 'application/json'
                    });

                    response.write(body);
                    response.end();
                    callback(null);
                } else {
                    var statusCode = 500;
                    if(err === DataSource.ERROR.NOT_FOUND){
                        statusCode = 404;
                    }
                    callback(new HttpError(err, statusCode));
                }
            });
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _update: function (context, callback) {
            var collection = this._findCollection(context);
            var model = collection.createItem(this.$resourceId);

            var payload = context.request.params;

            var processor = this.$restHandler.$restDataSource.getProcessorForModel(model);

            model.set(processor.parse(model, payload));

            // TODO: add hook to add session data like user id
            flow()
                .seq(function (cb) {
                    model.validate(function (err) {
                        cb(err);
                    });
                })
                .seq(function(cb){
                    model.save({}, function (err) {
                        if (!err) {
                            // TODO: do correct invalidation
                            collection.invalidatePageCache();

                            // TODO: generate the location header
                            var body = "";

                            var response = context.response;
                            response.writeHead(200, "", {
                                'Content-Type': 'application/json'
                            });

                            response.write(body);
                            response.end();

                            cb(null);
                        } else {
                            var statusCode = 500;
                            if (err === DataSource.ERROR.NOT_FOUND) {
                                statusCode = 404;
                            }
                            cb(new HttpError(err, statusCode));
                        }
                    });
                }).exec(callback);

        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _delete: function (context, callback) {
            var collection = this._findCollection(context);
            var model = collection.createItem(this.$resourceId);

            model.remove({}, function (err) {
                if (!err) {
                    // TODO: do correct invalidation
                    collection.invalidatePageCache();
                    // TODO: generate the location header
                    var body = "";

                    var response = context.response;
                    response.writeHead(200, "", {
                        'Content-Type': 'application/json'
                    });

                    response.write(body);
                    response.end();

                    callback(null);
                } else {
                    var statusCode = 500;
                    if (err === DataSource.ERROR.NOT_FOUND) {
                        statusCode = 404;
                    }
                    callback(new HttpError(err, statusCode));
                }
            });
        }

    });
});