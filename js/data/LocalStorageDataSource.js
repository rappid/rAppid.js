define(["js/data/DataSource", "js/data/Model", "flow"],
    function (DataSource, Model, flow) {

        var jsonFormatProcessor = new DataSource.JsonFormatProcessor();

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
                var value = this.$storage.getItem(this.$.name);
                this.$data = (value && this.getFormatProcessor(null).deserialize(value)) || {};
            },
            getFormatProcessor: function(action){
                return jsonFormatProcessor;
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
            _getCollectionData : function(path, contextPath){
                if (!path) {
                    callback("path for model unknown", null, options);
                    return;
                }

                // build uri
                var uri = [];
                if(contextPath){
                    uri = uri.concat(contextPath);
                }
                uri = uri.concat(path);

                return this.$data[uri.join(":")] || {};
            },
            loadCollectionPage: function (page, options, callback) {
                callback = callback || function(){};

                var path = page.$collection.$options.path ?
                    page.$collection.$options.path : this.getPathForAlias(page.$collection.$alias);

                var contextPath = page.$collection.$context.getPathComponents();



                var data = [], collection = this._getCollectionData(path, contextPath);
                for (var key in collection) {
                    if(collection.hasOwnProperty(key)){
                        data.push(this.$data[key]);
                    }
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
                            payload.id = DataSource.IdGenerator.genId();
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

                            var collection = self.$data[uri.join(":")] || {};
                            collection[payload.id] = true;
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

                payload = model.parse(payload);

                // TODO: resolve references
                model.set(payload);

                callback(null, model, options);
            },
            removeModel: function(model, options, callback){
                callback = callback || function () {
                };

                var payload;
                if (model.$.id) {
                    delete this.$data[model.$.id];

                    var collection = this._getCollectionData(this.getPathComponentsForModel(model));
                    if(collection){
                        delete collection[model.$.id];
                    }
                } else {
                    callback("Model has no id");
                    return;
                }
                this._saveStorage();

                callback(null, model, options);
            },

            _saveStorage: function(){
                this.$storage.setItem(this.$.name,this.getFormatProcessor(null).serialize(this.$data));
            }

        });
    });