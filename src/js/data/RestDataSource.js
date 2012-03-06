var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.data.RestDataSource", ["js.data.DataSource", "js.core.Base"], function (DataSource, Base) {

        var RestContext = DataSource.Context.inherit({
            getPathComponents: function() {
                return [];
            }
        });


        var RestDataSource = DataSource.inherit({
            ctor: function() {
                this.callBase();
                this.$processors = [];

                this.initializeProcessors();
            },

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
                    console.warn("No end-point for RestDataSource definied");
                }

                if (!this.$.gateway) {
                    this.$.gateway = this.$.endPoint;
                }

            },

            _childrenInitialized: function () {
                this.callBase();

                for (var c = 0; c < this.$configurations.length; c++) {
                    var config = this.$configurations[c];

                    if (config.className == "js.conf.Type") {
                        this.$configuredTypes.push(config);
                    }
                }
            },

            getClass: function (type) {
                if (rAppid._.isFunction(type)) {
                    return type;
                } else {
                    return rAppid.getDefinition(this.getFqClassName(type));
                }
            },

            createContext: function (datasource, properties, parentContext) {
                return new RestContext(datasource, properties, parentContext);
            },

            loadClass: function (type, callback) {
                if (rAppid._.isFunction(type)) {
                    callback(null, type);
                } else {
                    var classname = this.getFqClassName(type);
                    if (classname) {
                        rAppid.require(classname, function (klass) {
                            callback(null, klass);
                        });
                    } else {
                        callback("classname not found for type '" + type + "'");
                    }
                }
            },

            getFqClassName: function (alias) {
                return rAppid._.find(this.$configuredTypes, function (typeConfig) {
                    var ali = typeConfig.$.alias ? typeConfig.$.alias : typeConfig.$.className.split(".").pop();

                    if (ali == alias) {
                        return typeConfig.$.className;
                    }
                });
            },

            getPathForClassname: function(fqClassname) {

                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var typeConfig = this.$configuredTypes[i];
                    if (typeConfig.$.className == fqClassname) {
                        return typeConfig.$.path;
                    }
                }

                return null;
            },

            getPathComponentsForModel: function(model) {
                var path = this.getPathForClassname(model.className);

                if (path) {
                    var ret = [path];

                    if (model.status() == "CREATED"){
                        ret.push(model.$.id);
                    }

                    return ret;
                }

                return null;
            },


            /**
             * serialize the data
             * @param data
             */
            serialize: function (data) {
                return JSON.stringify(data);
            },

            /**
             * deserialize
             * @param input
             * @param processor
             */
            deserialize: function (input) {
                // TODO: enable IE7 and FF3 support? Or should the user add json2.js lib
                return JSON.parse(input);
            },

            /**
             *
             * @param model
             * @param options
             * @param callback function(err, model, options)
             */
            load: function (model, options, callback) {
                // map model to url
                var modelPathComponents = this.getPathComponentsForModel(model);

                if (!modelPathComponents) {
                    callback("path for model unknown", null, options);
                    return;
                }

                var uri = [this.$.gateway];
                uri = uri.concat(model.$context.getPathComponents());
                uri = uri.concat(modelPathComponents);

                var url = uri.join("/");

                // TODO add query parameters
                url = url + "?mediaType=json";

                var self = this;

                // send request
                rAppid.ajax(url, {
                    type: "GET"
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

                            // set data
                            model.set(data);

                            // and return
                            callback(null, model, options);

                        } catch (e) {
                            callback(e, null, options);
                        }

                    } else {
                        // TODO: better error handling
                        err = err || "wrong status code";
                        callback(err, null, options);
                    }
                });

            }
        });

        RestDataSource.RestContext = RestContext;

        RestDataSource.Processor = Base.inherit({
            serialize: function(data) {
                throw "abstract method";
            },
            deserialize: function(responses) {
                throw "abstract method";
            }
        });

        RestDataSource.JsonProcessor = RestDataSource.Processor.inherit({
            serialize: function (data) {
                return JSON.stringify(data);
            },
            deserialize: function (responses) {
                return JSON.parse(responses.text);
            }
        });

        return RestDataSource;

    });
});