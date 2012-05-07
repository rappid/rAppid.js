define(["require", "js/data/DataSource", "js/data/ReferenceDataSource", "js/core/Base", "js/core/List", "underscore"], function (require, DataSource, ReferenceDataSource, Base, List, _) {

    var RestContext = DataSource.Context.inherit("js.data.RestDataSource.Context", {

        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$datasource.$.collectionPageSize
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

    var RestDataSource = ReferenceDataSource.inherit("js.data.RestDataSource", {

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

        createContext: function (properties, parentContext) {
            return new RestContext(this, properties, parentContext);
        },

        getRestPathForModel: function (modelClassName) {

            var typeConfig,
                i;

            // first search via className
            for (i = 0; i < this.$configuredTypes.length; i++) {
                typeConfig = this.$configuredTypes[i];
                if (typeConfig.$.modelClassName == modelClassName) {
                    return typeConfig.$.path;
                }
            }

            // search via alias
            for (i = 0; i < this.$configuredTypes.length; i++) {
                typeConfig = this.$configuredTypes[i];
                if (typeConfig.$.alias == modelClassName) {
                    return typeConfig.$.path;
                }
            }

            return null;
        },

        getPathComponentsForModel: function (model) {
            var path = this.getRestPathForModel(model.modelClassName);

            if (path) {
                var ret = [path];

                if (model.status() == "CREATED") {
                    ret.push(model.$.id);
                }

                return ret;
            }

            return null;
        },

        getQueryParameter: function () {
            return {};
        },

        getContextPropertiesFromReference: function (reference) {
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
            var params = _.defaults(model.$context.getQueryParameter(), this.getQueryParameter());

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$systemManager.$applicationContext.ajax(url, {
                type: "GET",
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find processor that matches the content-type
                    var processor,
                        contentType = xhr.getResponseHeader("Content-Type");
                    for (var i = 0; i < self.$processors.length; i++) {
                        var processorEntry = self.$processors[i];
                        if (processorEntry.regex.test(contentType)) {
                            processor = processorEntry.processor;
                            break;
                        }
                    }

                    if (!processor) {
                        callback("No processor for content type '" + contentType + "' found", null, options);
                        return;
                    }

                    try {
                        // deserialize data with processor
                        var data = processor.deserialize(xhr.responses);

                        // parse data inside model
                        data = model.parse(data);

                        self.resolveReferences(model, data, options, function (err, resolvedData) {
                            if (!err) {
                                // set data
                                model.set(resolvedData);
                            }

                            // and return
                            callback(err, model, options);
                        });

                    } catch (e) {
                        callback(e, null, options);
                    }

                } else {
                    // TODO: better error handling
                    err = err || "wrong status code";
                    callback(err, null, options);
                }
            });

        },

        extractListMetaData: function (list, payload, options) {
            return payload;
        },

        extractListData: function (list, payload, options) {
            return payload.data;
        },

        loadCollectionPage: function (page, options, callback) {


            var modelPathComponents = page.$collection.$options.path ? page.$collection.$options.path : this.getPathComponentsForModel(page.$collection.$options.factory);

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
            params = _.defaults(params, page.$collection.$context.getQueryParameter(), this.getQueryParameter());

            // create url
            var url = uri.join("/");

            var self = this;

            // send request
            this.$systemManager.$applicationContext.ajax(url, {
                type: "GET",
                queryParameter: params
            }, function (err, xhr) {
                if (!err && (xhr.status == 200 || xhr.status == 304)) {
                    // find processor that matches the content-type
                    var processor,
                        contentType = xhr.getResponseHeader("Content-Type");
                    for (var i = 0; i < self.$processors.length; i++) {
                        var processorEntry = self.$processors[i];
                        if (processorEntry.regex.test(contentType)) {
                            processor = processorEntry.processor;
                            break;
                        }
                    }

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

                        self.resolveReferences(page, data, options, function (err, resolvedData) {

                            // add data to list
                            page.add(resolvedData);

                            // and return
                            callback(null, page, options);
                        });

                    } catch (e) {
                        callback(e, null, options);
                    }

                } else {
                    // TODO: better error handling
                    err = err || "wrong status code";
                    callback(err, page, options);
                }
            });
        }
    });

    RestDataSource.RestContext = RestContext;

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

    return RestDataSource;

});