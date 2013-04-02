define(["js/data/DataSource", "js/data/Model", "flow", "js/data/LocalStorage"],
    function (DataSource, Model, flow, LocalStorage) {

        var jsonFormatProcessor = new DataSource.JsonFormatProcessor();

        var LocalStorageProcessor = DataSource.Processor.inherit('src.data.RestDataSource.RestDataProcessor', {
            _composeSubModel: function (model, action, options) {
                return {
                    id: model.$.id
                };
            }
        });

        var LocalStorageDataSource = DataSource.inherit("js.data.LocalStorageDataSource", {
            defaults: {
                name: 'default'
            },
            $defaultProcessorFactory: LocalStorageProcessor,
            ctor: function () {
                this.callBase();

                this.$storage = this._getStorage();

                if (!this.$storage) {
                    throw "Storage not available";
                }
                var value = this.$storage.getItem(this.$.name);
                this.$data = (value && this.getFormatProcessor(null).deserialize(value)) || {};
            },
            _getStorage: function () {
                return this.createComponent(LocalStorage);
            },
            getFormatProcessor: function (action) {
                return jsonFormatProcessor;
            },
            getPathComponentsForModel: function (model) {
                if (model) {
                    var conf = this.getConfigurationForModelClass(model.factory);
                    if (conf) {
                        return [conf.$.path];
                    }
                }
                return null;
            },

            /***
             * creates the context as RestContext
             *
             * @param properties
             * @param parentContext
             * @return {js.core.RestDataSource.RestContext}
             */
            createContext: function (contextModel, properties, parentContext) {
                return new LocalStorageDataSource.Context(this, contextModel, properties, parentContext);
            },

            _getCollectionData: function (path, contextPath) {
                if (!path) {
                    callback("path for model unknown", null, options);
                    return;
                }

                // build uri
                var uri = [];
                if (contextPath) {
                    uri = uri.concat(contextPath);
                }
                uri = uri.concat(path);

                return this.$data[uri.join(":")] || {};
            },
            loadCollectionPage: function (page, options, callback) {
                callback = callback || function () {
                };

                var rootCollection = page.getRoot();
                var configuration = this.getConfigurationForModelClass(page.$collection.$modelFactory);

                if (!configuration) {
                    throw new Error("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
                }

                var path = [configuration.$.path];

                if (!path) {
                    callback("Path for model unknown", null, options);
                    return;
                }

                var data = [], collection = this._getCollectionData(path, rootCollection.$context.getPathComponents());
                for (var key in collection) {
                    if (collection.hasOwnProperty(key)) {
                        data.push(_.clone(this.$data[key]));
                    }
                }

                var processor = this.getProcessorForCollection(page);

                rootCollection.set('$itemsCount', data.length);

                data = processor.parseCollection(page.getRoot(), data, DataSource.ACTION.LOAD, options);

                page.add(data);


                callback(null, page, options);
            },
            _saveModel: function (model, options, callback) {

                callback = callback || function () {
                };


                var action = DataSource.ACTION.UPDATE;

                if (model._status() === Model.STATE.NEW) {
                    action = DataSource.ACTION.CREATE;
                }

                var processor = this.getProcessorForModel(model, options);
                var self = this;

                // call save of the processor to save submodels
                flow()
                    .seq(function (cb) {
                        // compose data in model and in processor
                        var payload = processor.compose(model, action, options);
                        if (model._status() === Model.STATE.NEW) {
                            payload.id = DataSource.IdGenerator.genId();
                        }
                        self.$data[payload.id] = payload;

                        // add
                        if (action === DataSource.ACTION.CREATE) {
                            // get collection url for url
                            var modelPathComponents = self.getPathComponentsForModel(model);

                            if (!modelPathComponents) {
                                cb("path for model unknown");
                                return;
                            }

                            // build uri
                            var uri = [];
                            uri = uri.concat(model.$context.getPathComponents());
                            uri = uri.concat(modelPathComponents);

                            var collection = self.$data[uri.join(":")] || {};
                            collection[payload.id] = true;
                            self.$data[uri.join(":")] = collection;
                        }

                        self._saveStorage();
                        model.set('id', payload.id);
                        cb();
                    })
                    .exec(function (err) {
                        callback(err, model, options);
                    });


            },
            loadModel: function (model, options, callback) {
                callback = callback || function () {
                };

                var formatProcessor = this.getFormatProcessor(DataSource.ACTION.LOAD);

                var processor = this.getProcessorForModel(model);

                var payload;

                if (model.$.id) {
                    payload = this.$data[model.$.id];
                } else {
                    callback("Model has no id");
                    return;
                }

                if (!payload) {
                    callback("Could not find model");
                    return;
                }

                payload = processor.parse(model, payload, DataSource.ACTION.LOAD, options);

                // TODO: resolve references
                model.set(payload);

                callback(null, model, options);
            },
            removeModel: function (model, options, callback) {
                callback = callback || function () {
                };

                var payload;
                if (model.$.id) {
                    delete this.$data[model.$.id];

                    var collection = this._getCollectionData(this.getPathComponentsForModel(model));
                    if (collection) {
                        delete collection[model.$.id];
                    }
                } else {
                    callback("Model has no id");
                    return;
                }
                this._saveStorage();

                callback(null, model, options);
            },

            _saveStorage: function () {
                this.$storage.setItem(this.$.name, this.getFormatProcessor(null).serialize(this.$data));
            }
        });

        LocalStorageDataSource.Context = DataSource.Context.inherit("js.data.LocalStorageDataSource.Context", {
            getPathComponents: function () {

                var path = [];

                if (this.$parent) {
                    path = this.$parent.getPathComponents();
                } else {
                    return [];
                }

                if (!this.$contextModel) {
                    throw new Error("ContextModel missing for non-root-Context");
                }

                var configuration = this.$dataSource.getConfigurationForModelClass(this.$contextModel.factory);
                path.push(configuration.$.path, this.$contextModel.$.id);

                return path;

            },

            createCollection: function (factory, options, type) {
                options = options || {};
                _.defaults(options, {
                    pageSize: Number.MAX_VALUE
                });

                return this.callBase(factory, options, type);
            },

            getQueryParameters: function () {
                return {};
            }
        });


        return LocalStorageDataSource;
    });