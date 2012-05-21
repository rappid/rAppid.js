define(["js/data/DataSource", "js/core/Base", "js/data/Model", "underscore"], function (DataSource, Base, Model, _) {

    var rIdExtractor = /http.+\/([^/]+)$/;

    var RestDataSource = DataSource.inherit("js.data.RestDataSource", {

        initializeProcessors: function () {
            this.$processors.push({
                regex: /json/,
                processor: new RestDataSource.JsonProcessor()
            });
        },

        defaults: {
            endPoint: null,
            gateway: null
        },

        initialize: function () {

            if (!this.$.endPoint) {
                console.warn("No end-point for RestDataSource defined");
            }

            if (!this.$.gateway) {
                this.$.gateway = this.$.endPoint;
            }

        },

        /***
         * creates the context as RestContext
         *
         * @param properties
         * @param parentContext
         * @return {js.core.RestDataSource.RestContext}
         */
        createContext: function (properties, parentContext) {
            return new RestDataSource.RestContext(this, properties, parentContext);
        },

        /***
         * global query parameter for each REST action
         * @action {String} Rest action [GET, PUT, DELETE, POST]
         * @return {Object}
         */
        getQueryParameter: function (action) {
            return {};
        },

        getRestPathForAlias: function (alias) {

            var typeConfig,
                i;

            // search via alias
            for (i = 0; i < this.$configuredTypes.length; i++) {
                typeConfig = this.$configuredTypes[i];
                if (typeConfig.$.alias == alias) {
                    return typeConfig.$.path;
                }
            }

            return null;
        },

        getPathComponentsForModel: function (model) {

            if (model) {
                var path = this.getRestPathForAlias(model.$alias);

                if (path) {

                    var ret = [path];

                    if (model.status() === Model.STATE.CREATED) {
                        ret.push(model.$.id);
                    }

                    return ret;
                }
            }

            return null;
        },

        /**
         *
         * @param model
         * @param options
         * @param callback function(err, model, options)
         */
        loadModel: function (model, options, callback) {
            // map model to url
            var modelPathComponents = this.getPathComponentsForModel(model);

            if (!modelPathComponents) {
                callback("path for model unknown", null, options);
                return;
            }

            // build uri
            var uri = [this.$.gateway];
            uri = uri.concat(model.$context.getPathComponents());
            uri = uri.concat(modelPathComponents);

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameter(),
                this.getQueryParameter(RestDataSource.ACTIONS.GET));

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$systemManager.$applicationContext.ajax(url, {
                type: RestDataSource.ACTIONS.GET,
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find processor that matches the content-type
                    var contentType = xhr.getResponseHeader("Content-Type");
                    var processor = self.getProcessorForContentType(contentType);

                    if (!processor) {
                        callback("No processor for content type '" + contentType + "' found", null, options);
                        return;
                    }

                    try {
                        // deserialize data with processor
                        var data = processor.deserialize(xhr.responses);

                        // parse data inside model
                        data = model.parse(data);

                        model.set(data);

                        callback(null, model, options);

                    } catch (e) {
                        callback(e, null, options);
                    }

                } else {
                    // TODO: better error handling
                    err = err || "Got status code " + xhr.status + " for '" + url + "'";
                    callback(err, null, options);
                }
            });

        },

        /***
         *
         * @param request.url
         * @param request.queryParameter
         * @param request.model
         * @param request.options
         * @param xhr
         * @param callback
         */
        handleCreationError: function (request, xhr, callback) {
            if (callback) {
                callback({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
        },

        /***
         *
         * @param request.url
         * @param request.queryParameter
         * @param request.model
         * @param request.options
         * @param xhr
         * @param callback
         */
        handleCreationSuccess: function (request, xhr, callback) {

            var model = request.model;

            var cb = function(err) {
                if (callback) {
                    callback(err, model, request.options);
                }
            };

            try { // get location header
                var location = xhr.getResponseHeader('Location');

                if (location) {
                    // extract id
                    var id = this.extractIdFromLocation(location, request);

                    if (id || id === 0) {
                        model.set('id', id);
                        // TODO: Put content
                        cb(null);
                    } else {
                        cb("Id couldn't be extracted");
                    }

                } else {
                    cb('Location header not found');
                }

            } catch (e) {
                cb(e || true);
            }
        },

        extractIdFromLocation: function(location, request) {
            var param = rIdExtractor.exec(location);

            if (param) {
                return param[1];
            }

            return null;
        },


        saveModel: function (model, options, callback) {

            // map model to url
            var modelPathComponents = this.getPathComponentsForModel(model);

            if (!modelPathComponents) {
                callback("path for model unknown", null, options);
                return;
            }

            // build uri
            var uri = [this.$.gateway];
            uri = uri.concat(model.$context.getPathComponents());
            uri = uri.concat(modelPathComponents);

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameter(),
                this.getQueryParameter(RestDataSource.ACTIONS.POST));

            // TODO: create hook, which can modify url and queryParameter

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$systemManager.$applicationContext.ajax(url, {
                type: RestDataSource.ACTIONS.POST,
                queryParameter: params,
                data: '{}'
            }, function (err, xhr) {

                var request = {
                    url: url,
                    queryParameter: params,
                    model: model,
                    options: options
                };

                if (!err && xhr.status === 201) {
                    self.handleCreationSuccess(request, xhr, callback)
                } else {
                    // error handling
                    self.handleCreationError(request, xhr, callback);
                }

            });

        },

        loadCollectionPage: function (page, options, callback) {

            var modelPathComponents = page.$collection.$options.path ?
                page.$collection.$options.path : this.getRestPathForAlias(page.$collection.$alias);

            if (!modelPathComponents) {
                callback("path for model unknown", null, options);
                return;
            }

            // build uri
            var uri = [this.$.gateway];
            uri = uri.concat(page.$collection.$context.getPathComponents());
            uri = uri.concat(modelPathComponents);

            var params = {};

            _.defaults(params, (options || {}).params);

            if (page.$limit) {
                params.limit = page.$limit;
            }

            if (page.$offset) {
                params.offset = page.$offset;
            }

            // get queryParameter
            params = _.defaults(params, page.$collection.$context.getQueryParameter(), this.getQueryParameter(RestDataSource.ACTIONS.GET));

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$systemManager.$applicationContext.ajax(url, {
                type: RestDataSource.ACTIONS.GET,
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find processor that matches the content-type
                    var contentType = xhr.getResponseHeader("Content-Type");
                    var processor = self.getProcessorForContentType(contentType);

                    if (!processor) {
                        callback("No processor for content type '" + contentType + "' found", null, options);
                        return;
                    }

                    try {
                        // deserialize data with processor
                        var payload = processor.deserialize(xhr.responses);

                        // extract meta data
                        var metaData = self.extractListMetaData(page, payload, options);

                        if (metaData && metaData.count) {
                            // set itemsCount in collection for page calculation
                            page.$collection.$itemsCount = metaData.count;
                        }

                        // extract data from list result
                        var data = self.extractListData(page, payload, options);

                        data = page.parse(data);
                        page.add(data);

                        callback(null, page, options)

                    } catch (e) {
                        self.log(e, 'error');
                        callback(e, page, options);
                    }

                } else {
                    // TODO: better error handling
                    err = err || "wrong status code";
                    callback(err, page, options);
                }
            });
        },

        getProcessorForContentType: function(contentType) {
            for (var i = 0; i < this.$processors.length; i++) {
                var processorEntry = this.$processors[i];
                if (processorEntry.regex.test(contentType)) {
                    return processorEntry.processor;
                }
            }

            return null;
        }

    });

    RestDataSource.RestContext = DataSource.Context.inherit("js.data.RestDataSource.Context", {

        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$datasource.$.collectionPageSize || 100
            });

            return this.callBase(factory, options, type);
        },

        getPathComponents: function () {
            return [];
        },
        getQueryParameter: function () {
            return {};
        }
    });


    RestDataSource.ACTIONS = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    };

    RestDataSource.Processor = Base.inherit("js.data.RestDataSource.Processor", {
        serialize: function (data) {
            throw "abstract method";
        },
        deserialize: function (responses) {
            throw "abstract method";
        }
    });

    RestDataSource.JsonProcessor = RestDataSource.Processor.inherit("js.data.RestDataSource.JsonProcessor", {
        serialize: function (data) {
            return JSON.stringify(data);
        },
        deserialize: function (responses) {
            return JSON.parse(responses.text);
        }
    });

    // TODO: implement XmlProcessor
    RestDataSource.XmlProcessor = RestDataSource.Processor.inherit("js.data.RestDataSource.XmlProcessor", {
        serialize: function (data) {
            throw "not implemented";
        },
        deserialize: function (responses) {
            throw "not implemented";
        }
    });

    return RestDataSource;
});