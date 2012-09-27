define(["js/data/DataSource", "js/core/Base", "js/data/Model", "underscore", "flow", "JSON", "js/data/Collection"], function (DataSource, Base, Model, _, flow, JSON, Collection) {

    var rIdExtractor = /http.+\/([^/]+)$/;

    var RestDataProcessor = DataSource.Processor.inherit('src.data.RestDataSource.RestDataProcessor', {
        _composeSubModel: function (model, action, options) {
            // TODO: add href
            return {
                id: model.$.id
            }
        }
    });

    var RestDataSource = DataSource.inherit("js.data.RestDataSource", {

        defaults: {
            endPoint: null,
            gateway: null
        },

        ctor: function(){
            this.callBase();
        },
        $defaultProcessorFactory: RestDataProcessor,
        initialize: function () {

            if (!this.$.endPoint) {
                console.warn("No end-point for RestDataSource defined");
            }

            if (!this.$.gateway) {
                this.$.gateway = this.$.endPoint;
            }

        },

        _validateConfiguration: function() {
            if (!this.$dataSourceConfiguration) {
                throw "No DataSourceConfiguration specified";
            }
        },

        initializeFormatProcessors: function () {

            var jsonProcessor = new DataSource.JsonFormatProcessor();
            jsonProcessor.regex = /json/;

            this.$formatProcessors.push(jsonProcessor);

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

        getPathComponentsForModel: function (model) {

            if (model) {
                var config = this.$dataSourceConfiguration.getConfigurationForModelClassName(model.constructor.name);
                if (config) {

                    var path = config.$.path;

                    if (path) {
                        var ret = [path];

                        if (!model.isNew()) {
                            ret.push(model.$.id);
                        }

                        return ret;
                    }
                }
            }

            return null;
        },

        _buildUriForModel: function(model){
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

            if (this.$.suffix) {
                uri[uri.length - 1] = uri[uri.length - 1] + "." + this.$.suffix;
            }

            return uri.join("/");
        },
        /**
         *
         * @param model
         * @param options
         * @param callback function(err, model, options)
         */
        loadModel: function (model, options, callback) {
            var self = this;

            // create url
            var url = this._buildUriForModel(model);

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameter(),
                this.getQueryParameter(RestDataSource.METHOD.GET));

            if(options.noCache){
                params.timestamp = (new Date().getTime());
            }

            flow()
                .seq("xhr", function(cb) {
                    // send request
                    self.$stage.$applicationContext.ajax(url, {
                        type: RestDataSource.METHOD.GET,
                        queryParameter: params
                    }, cb);
                })
                .seq(function(cb) {
                    var xhr = this.vars.xhr;

                    if (xhr.status === 200 || xhr.status === 304) {
                        // find processor that matches the content-type
                        var contentType = xhr.getResponseHeader("Content-Type");
                        var formatProcessor = self.getFormatProcessorForContentType(contentType);

                        if (!formatProcessor) {
                            callback("No formatProcessor for content type '" + contentType + "' found", null, options);
                            return;
                        }

                        // deserialize data with format processor
                        var data = formatProcessor.deserialize(xhr.responses.text);

                        var processor = self.getProcessorForModel(model, options);

                        // parse data inside processor
                        data = processor.parse(model, data, DataSource.ACTION.LOAD, options);

                        // parse data inside model
                        data = model.parse(data);

                        // set data
                        model.set(data);

                        cb(null, model, options);

                    } else {
                        // TODO: better error handling
                        cb("Got status code " + xhr.status + " for '" + url + "'", xhr, null, options);
                    }
                })
                .exec(function(err) {
                    if (callback) {
                        callback(err, model, options);
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
        handleSaveError: function (request, xhr, callback) {
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

                        var schema = model.$schema, schemaType;
                        for(var schemaKey in schema){
                            if(schema.hasOwnProperty(schemaKey)){
                                schemaType = schema[schemaKey];
                                if(schemaType.classof && schemaType.classof(Collection)){
                                    var contextForChildren = model.getContextForChild(schemaType);
                                    model.set(schemaKey, contextForChildren.createCollection(schemaType, null));
                                }

                            }
                        }

                        model.$context.addEntityToCache(model);

                        // TODO: ask processor if i should call save again to put content
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

        /***
         *
         * @param request.url
         * @param request.queryParameter
         * @param request.model
         * @param request.options
         * @param xhr
         * @param callback
         */
        handleUpdateSuccess: function (request, xhr, callback) {

            var model = request.model;

            if (callback) {
                callback(null, model, request.options);
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

            var action = DataSource.ACTION.UPDATE,
                method = RestDataSource.METHOD.PUT;

            if (model._status() === Model.STATE.NEW) {
                action = DataSource.ACTION.CREATE;
                method = RestDataSource.METHOD.POST;
            }

            var processor = this.getProcessorForModel(model, options);
            var formatProcessor = this.getFormatProcessor(action);
            var self = this;

            // call save of the processor to save sub models
            flow()
                .seq(function(cb) {
                    processor.saveSubModels(model, options, cb)
                })
                .seq(function(cb) {
                    // create url
                    var url = self._buildUriForModel(model);

                    // get queryParameter
                    var params = _.defaults(model.$context.getQueryParameter(),
                        self.getQueryParameter(method));

                    // TODO: create hook, which can modify url and queryParameter

                    var data = processor.compose(model, action, options);

                    // format payload
                    var payload = formatProcessor.serialize(data);

                    // send request
                    self.$stage.$applicationContext.ajax(url, {
                        type: method,
                        queryParameter: params,
                        data: payload,
                        contentType: formatProcessor.getContentType()
                    }, function (err, xhr) {

                        var request = {
                            url: url,
                            queryParameter: params,
                            model: model,
                            options: options
                        };

                        if (!err && action === DataSource.ACTION.CREATE && xhr.status === 201) {
                            self.handleCreationSuccess(request, xhr, cb)
                        } else if (!err && action === DataSource.ACTION.UPDATE && xhr.status === 200) {
                            self.handleUpdateSuccess(request, xhr, cb);
                        }
                        else {
                            // error handling
                            self.handleSaveError(request, xhr, cb);
                        }

                    });
                })
                .exec(function(err){
                    callback && callback(err, model, options);
                })


        },
        extractListMetaData: function (list, payload, options) {
            return payload;
        },

        extractListData: function (list, payload, options) {
            for (var key in payload) {
                if (payload.hasOwnProperty(key)) {
                    if (_.isArray(payload[key])) {
                        return payload[key];
                    }
                }
            }
        },
        loadCollectionPage: function (page, options, callback) {

            var rootCollection = page.getRootCollection();
            var config =  this.$dataSourceConfiguration.getConfigurationForModelClassName(rootCollection.$modelFactory.prototype.constructor.name);

            if(!config){
                throw new Error("Couldnt find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }
            var modelPathComponents = [config.$.path];



            if (!modelPathComponents) {
                callback("path for model unknown", null, options);
                return;
            }

            // build uri
            var uri = [this.$.gateway];
            uri = uri.concat(rootCollection.$context.getPathComponents());
            uri = uri.concat(modelPathComponents);

            if (this.$.suffix) {
                uri[uri.length - 1] = uri[uri.length - 1] + "." + this.$.suffix;
            }

            var params = {};

            _.defaults(params, (options || {}).params);

            if (page.$limit) {
                params.limit = page.$limit;
            }

            if (page.$offset) {
                params.offset = page.$offset;
            }

            if(options.noCache){
                params.timestamp = (new Date()).getTime();
            }
            params.fullData = options.fullData || false;


            // get queryParameter
            params = _.defaults(params, page.$collection.getQueryParameters(RestDataSource.METHOD.GET), rootCollection.$context.getQueryParameter(), this.getQueryParameter(RestDataSource.METHOD.GET));

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$stage.$applicationContext.ajax(url, {
                type: RestDataSource.METHOD.GET,
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find formatProcessor that matches the content-type
                    var contentType = xhr.getResponseHeader("Content-Type");
                    var formatProcessor = self.getFormatProcessorForContentType(contentType);

                    if (!formatProcessor) {
                        callback("No formatProcessor for content type '" + contentType + "' found", null, options);
                        return;
                    }

                    try {
                        // deserialize data with formatProcessor
                        var payload = formatProcessor.deserialize(xhr.responses.text);

                        // extract meta data
                        var metaData = self.extractListMetaData(page, payload, options);

                        if (metaData && metaData.hasOwnProperty('count')) {
                            // set itemsCount in collection for page calculation
                            page.$collection.set('$itemsCount', metaData.count);
                        }

                        // extract data from list result
                        var data = self.extractListData(page, payload, options);

                        var processor = self.getProcessorForCollection(page);

                        data = processor.parseCollection(page.getRootCollection(), data, DataSource.ACTION.LOAD, options);

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
        removeModel: function (model, options, callback) {
            callback = callback || function(){

            };

            // create url
            var url = this._buildUriForModel(model);

            var method = RestDataSource.METHOD.DELETE;

            // get queryParameter
            var params = _.defaults(model.$context.getQueryParameter(),
                this.getQueryParameter(method));

            this.$stage.$applicationContext.ajax(url, {
                type: method,
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    callback(null,model);
                } else {
                    // TODO: better error handling
                    err = err || "wrong status code";
                    callback(err, model);
                }
            });
        },
        getFormatProcessorForContentType: function(contentType) {
            for (var i = 0; i < this.$formatProcessors.length; i++) {
                var processorEntry = this.$formatProcessors[i];
                if (processorEntry.regex.test(contentType)) {
                    return processorEntry;
                }
            }

            return null;
        }

    });

    RestDataSource.RestContext = DataSource.Context.inherit("js.data.RestDataSource.Context", {
        ctor: function(dataSource, properties, parentContext){
            this.$contextModel = properties;
            this.callBase(dataSource, properties, parentContext);
        },

        createContextCacheId: function (contextModel) {
            return contextModel.constructor.name + "_" + contextModel.$.id;
        },

        getPathComponents: function(){

            if (!this.$parent) {
                // rootContext
                return [];
            }

            if (!this.$contextModel) {
                throw new Error("ContextModel missing for non-root-Context");
            }

            var configuration = this.$dataSource.getConfigurationForModelClassName(this.$contextModel.constructor.name);
            return [configuration.$.path, this.$contextModel.$.id];
        },

        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$dataSource.$.collectionPageSize || 100
            });

            return this.callBase(factory, options, type);
        },

        getQueryParameter: function () {
            return {};
        }
    });


    RestDataSource.METHOD = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    };

    // TODO: implement XmlProcessor
    RestDataSource.XmlFormatProcessor = DataSource.FormatProcessor.inherit("js.data.RestDataSource.XmlFormatProcessor", {
        serialize: function (data) {
            throw "not implemented";
        },
        deserialize: function (responses) {
            throw "not implemented";
        }
    });

    return RestDataSource;
});