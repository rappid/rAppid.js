define(["js/data/DataSource", "js/data/Model", "flow", "JSON"],
    function (DataSource, Model, flow, JSON) {

        var createUUID = (function (uuidRegEx, uuidReplacer) {
            return function () {
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
            };
        })(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == "x" ? r : (r & 3 | 8);
            return v.toString(16);
        });

        return DataSource.inherit("js.data.LocalStorageDataSource", {
            defaults : {
                name: 'default'
            },
            ctor: function() {
                this.callBase();

                this.$storage = this._getStorage();

                if (!this.$storage) {
                    throw "Storage not available";
                }
                // this.$storage.removeItem(this.$.name);
                var value = this.$storage.getItem(this.$.name);
                this.$data = (value && JSON.parse(value)) || {};
            },

            getPathComponentsForModel: function (model) {
                if (model) {
                    var conf = this.getConfigurationByAlias(model.$alias);
                    if (conf) {
                        return [conf.$.path];
                    }
                }
                return null;
            },

            getPathForAlias: function (alias) {

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

            _getStorage: function() {
                if (typeof window !== "undefined" && window.localStorage) {
                    return window.localStorage;
                }

                return null;
            },
            loadCollectionPage: function (page, options, callback) {
                callback = callback || function(){};

                var modelPathComponents = page.$collection.$options.path ?
                    page.$collection.$options.path : this.getPathForAlias(page.$collection.$alias);

                if (!modelPathComponents) {
                    callback("path for model unknown", null, options);
                    return;
                }

                // build uri
                var uri = [];
                uri = uri.concat(page.$collection.$context.getPathComponents());
                uri = uri.concat(modelPathComponents);

                var data = [], collection = this.$data[uri.join(":")] || [];
                for (var i = 0; i < collection.length; i++) {
                    data.push(this.$data[collection[i]]);
                }

                data = page.parse(data);
                page.add(data);


                callback(null, page, options);
            },
            saveModel: function (model, options, callback) {

                callback = callback || function(){
                };


                var action = DataSource.ACTION.UPDATE;

                if (model._status() === Model.STATE.NEW) {
                    action = DataSource.ACTION.CREATE;
                }

                var processor = this.getProcessorForModel(model, options);
                var formatProcessor = this.getFormatProcessor(action);
                var self = this;

                // call save of the processor to save submodels
                flow()
                    .seq(function (cb) {
                        processor.saveSubModels(model, options, cb)
                    })
                    .seq(function (cb) {
                        // compose data in model and in processor
                        var payload = model.compose(action, options);
                        if (model._status() === Model.STATE.NEW) {
                            payload.id = createUUID();
                        }

                        if (formatProcessor) {
                            payload = formatProcessor.serialize(payload);
                        }
                        self.$data[payload.id] = payload;

                        // add
                        if(action === DataSource.ACTION.CREATE){
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

                            var collection = self.$data[uri.join(":")] || [];
                            // TODO: check it its already in
                            collection.push(payload.id);
                            self.$data[uri.join(":")] = collection;
                        }

                        self._saveStorage();
                        model.set('id',payload.id);
                        cb();
                    })
                    .exec(function (err) {
                        callback(err, model, options);
                    })


            },
            loadModel: function(model, options, callback){
                callback = callback || function(){};

                var formatProcessor = this.getFormatProcessor(DataSource.ACTION.LOAD);

                var payload;
                if (model.$.id) {
                    payload = this.$data[model.$.id];
                } else {
                    callback("Model has no id");
                    return;
                }

                if(!payload){
                    callback("Could not find model");
                    return;
                }

                if (formatProcessor) {
                    payload = formatProcessor.deserialize(payload);
                }

                payload = model.parse(payload);

                // TODO: resolve references
                model.set(payload);

                callback(null, model, options);
            },
            _saveStorage: function(){
                this.$storage.setItem(this.$.name,JSON.stringify(this.$data));
            }

        });
    });