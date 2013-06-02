define(['js/core/Component', 'srv/core/HttpError', 'flow', 'require', 'JSON', 'js/data/Collection', 'js/data/DataSource', 'js/data/Model', 'underscore', 'js/core/List'], function (Component, HttpError, flow, require, JSON, Collection, DataSource, Model, _, List) {

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

        getPath: function () {
            return this.$resourceConfiguration.$.path;
        },

        getRootResource: function () {
            var root = this;
            while (root.$parentResource) {
                root = root.$parentResource;
            }
            return root;
        },

        isResponsibleForModel: function (model) {
            return model.constructor.name === this.$resourceConfiguration.$.modelClassName;
        },

        _getPathForModel: function (model, context) {
            var dataSource = this.getDataSource(context, this);

            var configuration = dataSource.getConfigurationForModelClass(model.factory);

            if (!configuration) {
                throw new Error("No configuration found for " + model.constructor.name);
            }

            var path = [configuration.$.path, model.identifier()];
            var parentModel = model.$context.$contextModel,
                parentConfiguration = configuration.$parent;
            while (parentModel) {
                path.unshift(parentConfiguration.$.path, parentModel.identifier());
                parentModel = parentModel.$context.$contextModel;
                parentConfiguration = parentConfiguration.$parent;
            }

            return path.join("/");
        },


        getResourceHandlerInstance: function () {
            return this;
        },

        getDataSource: function (context, resource) {
            if (this.$parentResource) {
                return this.$parentResource.getDataSource(context, resource || this);
            } else {
                return this.$restHandler.getDataSource(context, resource || this);
            }
        },

        handleRequest: function (context, callback) {

            var method = this._getRequestMethod(context),
                map = this._isCollectionResource() ? this.$collectionMethodMap : this.$modelMethodMap;

            var fn = this[map[method]];

            if (fn instanceof Function) {
                context.dataSource = this.getDataSource(context, this);
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
        /**
         * Returns a collection for this resource in the right context
         * @param {srv.core.Context} context
         * @param {Function} callback
         * @param {Boolean} [checkParents] - default true
         * @return {*}
         * @private
         */
        _findCollection: function (context, callback, checkParents) {
            if (this.$parentResource) {
                var self = this;
                flow()
                    .seq("parentCollection", function (cb) {
                        self.$parentResource._findCollection(context, cb);
                    })
                    .seq("parent", function (cb) {
                        var id = self.$parentResource.$resourceId,
                            parentCollection = this.vars.parentCollection;

                        id = parentCollection.$modelFactory.prototype.convertIdentifier(self.$parentResource.$resourceId);
                        var parent = parentCollection.createItem(id);

                        if(checkParents){
                            parent.fetch(null, cb);
                        } else {
                            cb();
                        }
                    })
                    .exec(function (err, results) {
                        if (!err) {
                            var collection = results.parent.getCollection(self.$resourceConfiguration.$.path);
                            collection.$context.$dataSource = self.$restHandler.getDataSource(context, self);
                            callback && callback(null, collection);
                        } else {
                            callback && callback(err);
                        }
                    });
            } else {
                var dataSource = this.$restHandler.getDataSource(context, this);
                callback && callback(null, dataSource.createCollection(Collection.of(this._getModelFactory()), {pageSize: 100}));
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
        _fetchAllHrefsForModel: function (model, context) {
            var self = this,
                baseUri = context.request.urlInfo.baseUri + this.$restHandler.$.path + "/";

            if (!model.$.href) {
                model.$.href = baseUri + this._getPathForModel(model);
            }

            for (var key in model.schema) {
                if (model.schema.hasOwnProperty(key)) {
                    var value = model.$[key];
                    if (value instanceof Model) {
                        value.$.href = baseUri + this._getPathForModel(value);
                    } else if (value instanceof Collection) {
                        value.$.href = model.$.href + "/" + key;
                    } else if (value instanceof List) {
                        value.each(function (item) {
                            if (item instanceof Model) {
                                item.$.href = baseUri + self._getPathForModel(item);
                            }
                        });
                    }
                }
            }
        },
        /***
         *
         * @param context
         * @param callback
         * @private
         */
        _index: function (context, callback) {
            var self = this,
                options,
                startIndex = 0,
                endIndex = 0,
                offset = 0,
                limit = 0,
                pages = [],
                items;

            flow()
                .seq("collection", function (cb) {
                    self._findCollection(context, cb, false);
                })
                .seq(function (cb) {
                    var parameters = context.request.urlInfo.parameter;

                    var query = self.$restHandler.parseQueryForResource(parameters, self);

                    this.vars.collection = this.vars.collection.query(query);
                    var pageSize = context.dataSource.$.collectionPageSize;
                    options = self._createOptionsForCollectionFetch(context, parameters);

                    if (parameters["limit"]) {
                        limit = parseInt(parameters["limit"]);
                    }

                    if (!limit || isNaN(limit)) {
                        limit = 100;
                    }

                    if (parameters["offset"]) {
                        offset = parseInt(parameters["offset"]);
                    }

                    // calculate page
                    limit = limit > pageSize ? pageSize : limit;
                    startIndex = offset || 0;
                    endIndex = offset + limit;

                    var firstPage = Math.floor(offset / pageSize),
                        lastPage = Math.floor((offset + limit) / pageSize);

                    for(var i = firstPage; i <= lastPage; i++){
                        pages.push(i);
                    }

                    cb();
                })
                .seq(function(cb){
                    var collection = this.vars.collection;
                    flow()
                        // TODO: don't use fetchPage
                        .seqEach(pages, function(page, cb){
                            collection.fetchPage(page, options, cb);
                        })
                        .exec(cb);
                })
                .seq(function (cb) {
                    items = this.vars["collection"].$items.slice(startIndex, endIndex);

                    cb();
                })
                .exec(function(err, results){
                    if(!err){
                        var response = context.response;

                        // switch context of collection to RestDataSource
                        var collection = results["collection"];
                        // call compose
                        var processor = self.$restHandler.$restDataSource.getProcessorForCollection(collection);

                        var itemArray = [];

                        items.forEach(function (item) {
                            var id = item.identifier();
                            if (id) {
                                self._fetchAllHrefsForModel(item, context);
                            }
                            itemArray.push(processor.compose(item));
                        });
                        var res = {
                            count: results["collection"].$itemsCount,
                            limit: limit,
                            offset: offset,
                            results: itemArray
                        };

                        response.writeHead(200, "", {
                            'Content-Type': 'application/json; charset=utf-8'
                        });

                        response.write(JSON.stringify(res), 'utf8');
                        response.end();

                         callback(null);
                    } else {
                        var statusCode = 404;
                        if (err === DataSource.ERROR.NOT_FOUND) {
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
        _create: function (context, callback) {

            var self = this,
                model,
                processor;

            flow()
                .seq("collection", function(cb){
                    self._findCollection(context, cb);
                })
                .seq(function(){
                    model = this.vars.collection.createItem();

                    var payload = context.request.params;

                    processor = self.$restHandler.$restDataSource.getProcessorForModel(model);

                    model.set(processor.parse(model, payload));

                    model.set('created', new Date());
                })
                .seq(function (cb) {
                    self._beforeModelCreate(model, context, cb);
                })
                // validate and save model
                .seq(function (cb) {
                    model.validateAndSave({action: DataSource.ACTION.CREATE }, cb);
                })
                .seq(function (cb) {
                    self._afterModelCreate(model, context, cb);
                }).
                exec(function (err, results) {
                    if (!err) {
                        // TODO: do correct invalidation
                        results.collection.invalidatePageCache();

                        var body = JSON.stringify(processor.compose(model, null));

                        var response = context.response;
                        response.writeHead(201, "", {
                            'Content-Type': 'application/json',
                            'Location': context.request.urlInfo.uri + "/" + model.identifier()
                        });

                        response.write(body);
                        response.end();

                        callback(null);
                    } else {
                        callback(new HttpError(err, 400));
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
            var self = this,
                model;

            flow()
                .seq("collection", function (cb) {
                    self._findCollection(context, cb, false);
                })
                .seq(function (cb) {
                    var modelFactory = self._getModelFactory();
                    var id = self.$resourceId;
                    id = modelFactory.prototype.convertIdentifier(id);
                    model = this.vars.collection.createItem(id);

                    if (context) {
                        // TODO: build options
                    }
                    model.fetch(null, cb);
                })
                .seq(function () {
                    // fetch hrefs for all sub models and sub collections
                    self._fetchAllHrefsForModel(model, context);
                })
                .exec(function (err) {
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

            var self = this,
                options = {},
                model,
                processor;


            flow()
                .seq("collection", function (cb) {
                    self._findCollection(context, cb);
                })
                .seq(function () {
                    model = this.vars.collection.createItem(self.$resourceId);

                    var payload = context.request.params;

                    processor = self.$restHandler.$restDataSource.getProcessorForModel(model);

                    model.set(processor.parse(model, payload || {}));

                    options.action = DataSource.ACTION.UPDATE;

                    // TODO: add hook to add session data like user id
                    if (self.$resourceConfiguration.$.upsert === true) {
                        options.upsert = true;
                        model.set(model.idField, model.factory.prototype.convertIdentifier(self.$resourceId));
                    }
                })
                .seq(function (cb) {
                    self._beforeModelUpdate(model, context, cb);
                })
                .seq(function (cb) {
                    model.validateAndSave(options, cb);
                })
                .seq(function (cb) {
                    self._afterModelUpdate(model, context, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        // TODO: do correct invalidation
                        results.collection.invalidatePageCache();

                        self._fetchAllHrefsForModel(model, context);

                        // TODO: generate the location header
                        var body = JSON.stringify(processor.compose(model, null));

                        var response = context.response;
                        response.writeHead(200, "", {
                            'Content-Type': 'application/json'
                            // TODO : add updated date in head ???
//                            'Location': context.request.urlInfo.uri
                        });

                        response.write(body);
                        response.end();

                        callback(null);
                    } else {
                        var statusCode = 400;
                        if (err === DataSource.ERROR.NOT_FOUND) {
                            statusCode = 404;
                        }
                        callback(new HttpError(err, statusCode));
                    }
                });

        },

        _autoGenerateValue: function (valueKey, context, model) {

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
            var model,
                self = this;

            flow()
                .seq("collection", function(cb){
                    self._findCollection(context, cb);
                })
                .seq(function(){
                    model = this.vars.collection.createItem(self.$resourceId);
                })
                .seq(function (cb) {
                    self._beforeModelRemove(model, context, cb);
                })
                // remove model
                .seq(function (cb) {
                    model.remove(null, cb);
                })
                .seq(function (cb) {
                    self._afterModelRemove(model, context, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        // TODO: do correct invalidation
                        results.collection.invalidatePageCache();
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
        _beforeModelCreate: function (model, context, callback) {
            callback && callback();
        },

        _beforeModelUpdate: function (model, context, callback) {
            this._beforeModelSave(model, context, callback);
        },

        _afterModelCreate: function (model, context, callback) {
            this._beforeModelSave(model, context, callback);
        },
        _afterModelUpdate: function (model, context, callback) {
            callback && callback();
        },
        _afterModelSave: function (model, context, callback) {
            callback && callback();
        },
        _beforeModelRemove: function (model, context, callback) {
            callback && callback();
        },
        _afterModelRemove: function (model, context, callback) {
            callback && callback();
        }
    });
});