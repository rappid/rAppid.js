define(['js/core/Component', 'srv/core/HttpError', 'flow', 'require', 'JSON', 'js/data/Collection', 'js/data/DataSource', 'js/data/Model', 'underscore'], function (Component, HttpError, flow, require, JSON, Collection, DataSource, Model, _) {

    return Component.inherit('srv.handler.rest.ResourceHandler', {
        defaults: {
            autoStartSession: true,
            defaultSortField: null,
            defaultSortOrder: null
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

        getResourceHandlerInstance: function () {
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

            var method = this._getRequestMethod(context),
                map = this._isCollectionResource() ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];

            if (fn instanceof Function) {
                context.dataSource = this.getDataSource(context);
                var body = context.request.body.content;

                if (body !== "") {
                    // TODO: handle different payload formats -> format processor needed
                    try {
                        context.request.params = JSON.parse(body);
                    } catch(e) {
                        console.warn("Couldn't parse " + body);
                    }
                }
                // TODO: better apply json post value here to the function
                fn.call(this, context, callback);

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

        _createOptionsForCollectionFetch: function (context, parameters) {

            var options = {};
            if (parameters["limit"]) {
                options["limit"] = parseInt(parameters["limit"]);
            }

            var sort = this._createSortStatement(context, parameters);
            if (sort) {
                options["sort"] = sort;
            }

            var where = this._createWhereStatement(context, parameters);
            if (where) {
                options["where"] = where;
            }

            return options;
        },
        _createSortStatement: function (context, parameters) {
            var sort;
            var sortField = parameters["sortField"] || this.$.defaultSortField;
            if (sortField) {
                sort = {};
                sort[sortField] = -1;
                var sortOrder = parameters["sortOrder"] || this.$.defaultSortOrder;
                if (sortOrder) {
                    sort[sortField] = sortOrder === "ASC" ? 1 : -1;
                }
            }

            return sort;
        },
        _createWhereStatement: function (context, parameters) {
            return null;
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

            var options = this._createOptionsForCollectionFetch(context, parameters);

            var self = this;

            collection.fetch(options, function (err, collection) {
                if (!err) {
                    var response = context.response;
                    var body = "", results = [];

                    // switch context of collection to restdatasource

                    // call compose
                    var processor = self.$restHandler.$restDataSource.getProcessorForCollection(collection);

                    results = processor.composeCollection(collection, null, _.defaults(options, self._getCompositionOptions(context)));

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

            var self = this;

            flow()
                .seq(function (cb) {
                    self._beforeModelSave(model, context, cb);
                })
                .seq(function (cb) {
                    model.validateAndSave(null, cb);
                }).
                seq(function (cb) {
                    self._afterModelCreate(model, context, cb);
                }).
                exec(function (err) {
                    if (!err) {
                        // TODO: do correct invalidation
                        collection.invalidatePageCache();

                        var body = JSON.stringify(processor.compose(model, null));

                        var response = context.response;
                        response.writeHead(201, "", {
                            'Content-Type': 'application/json',
                            'Location': context.request.urlInfo.uri + "/" + model.$.id
                        });

                        response.write(body);
                        response.end();

                        callback(null);
                    } else {
                        callback(new HttpError(err, 500));
                    }
                });
        },

        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _show: function (context, callback) {

            var modelFactory = this._getModelFactory(),
                model = context.dataSource.createEntity(modelFactory, this.$resourceId),
                self = this;

            // TODO: add fields/include option handling
            model.fetch(null, function (err, model) {
                if (!err) {
                    var processor = self.$restHandler.$restDataSource.getProcessorForModel(model);


                    var body = JSON.stringify(processor.compose(model, "GET", self._getCompositionOptions(context))),
                        response = context.response;

                    response.writeHead(200, {
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
        },

        _getCompositionOptions: function (context) {
            return {
                resourceHandler: this,
                baseUri: context.request.urlInfo.baseUri + this.$restHandler.$.path
            };
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

            var self = this;
            // TODO: add hook to add session data like user id
            flow()
                .seq(function (cb) {
                    self._beforeModelSave(model, context, cb);
                })
                .seq(function (cb) {
                    model.validateAndSave(null, cb);
                })
                .seq(function (cb) {
                    self._afterModelUpdate(model, context, cb);
                })
                .exec(function (err) {
                    if (!err) {
                        // TODO: do correct invalidation
                        collection.invalidatePageCache();

                        // TODO: generate the location header
                        var body = JSON.stringify(processor.compose(model, null));

                        var response = context.response;
                        response.writeHead(200, "", {
                            'Content-Type': 'application/json'
                            // TODO : add updated date in head ???
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

        },

        _autoGenerateValue: function (valueKey, context, model) {
            if (valueKey === Model.AUTO_GENERATE.CREATION_DATE) {
                if (model.isNew() || _.isUndefined(model.get(valueKey))) {
                    return new Date();
                }
            }

            if (valueKey === Model.AUTO_GENERATE.UPDATED_DATE) {
                return new Date();
            }

            if (valueKey === "SESSION_USER") {
                // TODO: return session user
                return null;
            }
        },

        /**
         *
         * @param model
         * @param context
         * @param callback
         * @private
         */
        _beforeModelSave: function (model, context, callback) {
            var schema = model.schema, schemaObject;
            for (var schemaKey in schema) {
                if (schema.hasOwnProperty(schemaKey)) {
                    schemaObject = schema[schemaKey];
                    if (schemaObject.generated) {
                        var value = this._autoGenerateValue(schemaObject.key, context, model);
                        if (!_.isUndefined(value)) {
                            model.set(schemaKey, value);
                        }
                    }
                }
            }

            callback && callback();
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

            var self = this;

            flow()
                .seq(function (cb) {
                    self._beforeModelRemove(model, context, cb);
                })
                .seq(function (cb) {
                    model.remove(null, cb)
                })
                .seq(function (cb) {
                    self._afterModelRemove(model, context, cb);
                })
                .exec(function (err) {
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
        },
        _afterModelCreate: function (model, options, callback) {
            callback && callback();
        },
        _afterModelUpdate: function (model, options, callback) {
            callback && callback();
        },
        _afterModelSave: function (model, options, callback) {
            callback && callback();
        },
        _beforeModelRemove: function (model, options, callback) {
            callback && callback();
        },
        _afterModelRemove: function (model, options, callback) {
            callback && callback();
        }
    });
});