define(['require', 'srv/core/Handler', 'js/conf/DataSourceConfiguration', 'js/conf/ResourceConfiguration', 'srv/handler/rest/ResourceRouter', 'flow', 'js/data/DataSource', 'js/data/RestDataSource', 'js/data/Model', 'srv/lib/RestQueryParser', 'js/data/Query', 'srv/handler/rest/ResourceHandler'],
    function (require, Handler, DataSourceConfiguration, ResourceConfiguration, ResourceRouter, flow, DataSource, RestDataSource, Model, RestQueryParser, Query, ResourceHandler) {

        var RestDataProcessor = RestDataSource.RestDataProcessor.inherit('srv.handler.rest.RestDataProcessor', {
            _composeSubModel: function (model, action, options) {
                if (model instanceof Model) {
                    var ret = {};
                    ret[model.idField] = model.identifier();
                    ret["href"] = model.$.href;
                    return ret;
                }
                return this.callBase();
            },
            _composeSubCollection: function (collection, action, options) {
                return {
                    href: collection.$.href
                };
            },
            _getCompositionValue: function (value, key, action, options, scope) {
                if (value instanceof Model) {
                    if (scope.schema[key] && scope.schema[key].compose === true) {
                        return this._composeEntity(value, action, options);
                    }
                }

                return this.callBase();
            },

            _composeEntity: function (entity, action, options) {
                var ret = this.callBase(),
                    schema = entity.schema;

                for (var key in schema) {
                    if (schema.hasOwnProperty(key)) {
                        if (schema[key].serverOnly === true) {
                            delete ret[key];
                        }
                    }
                }
                return ret;
            },

            compose: function (model, action, options) {

                var ret = this.callBase(model, action, options);
                ret.href = model.$.href;
                return ret;
            }
        });

        var ServerRestDataSource = RestDataSource.inherit('srv.handler.rest.RestDataSource', {
            $defaultProcessorFactory: RestDataProcessor,
            _getContext: function (factory, parent, data) {
                // here we have a combined id
                if (factory.classof && factory.classof(Model) && data[factory.prototype.idField] && data[factory.prototype.idField].indexOf("/") > -1) {
                    var ids = data[factory.prototype.idField].split("/");
                    data[factory.prototype.idField] = ids[ids.length - 1];
                    var config = this.getConfigurationForModelClass(factory),
                        baseConfig = config,
                        stack = [config];
                    for (var i = 0; i < ids.length - 1; i++) {
                        baseConfig = config.$parent;
                        stack.unshift(baseConfig);
                    }
                    var parentFactory,
                        parentModel,
                        context;
                    for (i = 0; i < ids.length; i++) {
                        parentFactory = requirejs(stack[i].$.modelClassName.replace(/\./gi, "/"));
                        context = this.getContextForChild(parentFactory, parentModel || parent);
                        parentModel = context.createEntity(parentFactory, ids[i]);
                        parentModel.$parent = context.$contextModel;
                    }
                    if (parentModel) {
                        return parentModel.$context;
                    }
                }
                return this.callBase();
            }
        });

        return Handler.inherit('srv.core.RestHandler', {

            ctor: function () {
                this.$resourceConfiguration = null;
                this.$dataSources = [];
                this.$modelClassResourceHandler = {};

                this.callBase();
            },

            defaults: {
                path: "/api"
            },

            addChild: function (child) {
                if (child instanceof DataSourceConfiguration) {
                    this.$resourceConfiguration = child;
                }

                if (child instanceof DataSource) {
                    this.$dataSources.push(child);
                }

                if (child instanceof ResourceHandler) {
                    if (child.$.modelClassName) {
                        this.$modelClassResourceHandler[child.$.modelClassName] = child;
                    }
                }

                this.callBase();
            },

            _getResourceRouter: function () {
                return new ResourceRouter(this);
            },

            start: function (server, callback) {
                if (!this.$resourceConfiguration) {
                    callback(new Error("ResourceConfiguration missing."));
                    return;
                }

                if (this.$dataSources.length === 0 && !this.$.dataSource) {
                    callback(new Error("DataSource missing."));
                    return;
                }

                var classes = [];

                function findClasses(resourceConfiguration) {
                    var config;
                    for (var i = 0; i < resourceConfiguration.$configurations.length; i++) {
                        config = resourceConfiguration.$configurations[i];
                        if (config instanceof ResourceConfiguration) {
                            if (config.$.modelClassName) {
                                classes.push(config.$.modelClassName.replace(/\./g, '/'));
                            }
                            // TODO: necessary ?
                            if (config.$.serverModelClassName) {
                                classes.push(config.$.serverModelClassName.replace(/\./g, '/'));
                            }
                            findClasses(config);
                        }
                    }
                }

                findClasses(this.$resourceConfiguration);

                // FIXME
                // TODO: remove $restDataSource and reuse getProcessorForModel and getProcessorForCollection an other way
                this.$restDataSource = new ServerRestDataSource({endPoint: "localhost"}, false);
                this.$restDataSource.addChild(this.$resourceConfiguration);
                this.$restDataSource._initialize("auto");

                require(classes, function () {
                    callback();
                }, function (err) {
                    callback(err);
                });

            },

            /***
             *
             * @param {srv.core.Context} context
             * @return {*}
             */
            getDataSource: function (context, resource) {
                return this.$.dataSource || this.$dataSources[0];
            },

            getHrefDataSource: function () {
                return this.$.dataSource || this.$dataSources[0];
            },

            handleRequest: function (context, callback) {

                var self = this;

                flow()
                    .seq("resource", function (cb) {
                        self._getResourceRouter().getResource(context, cb);
                    })
                    .seq(function (cb) {
                        this.vars["resource"].handleRequest(context, cb);
                    })
                    .exec(callback);

            },

            _getQueryParser: function () {
                return RestQueryParser.RestQueryParser;
            },
            /**
             *
             * @param {Object} parameters
             * @param {srv.handler.rest.ResourceHandler} resource
             * @return {*}
             */
            parseQueryForResource: function (parameters, resource) {
                // TODO: add is query allowed
                return this._getQueryParser().parse(parameters, Query.query());
            }
        });
    });