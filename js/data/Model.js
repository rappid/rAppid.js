define(["js/data/Entity", "js/core/List", "flow", "underscore"], function (Entity, List, flow, _) {

    var FETCHSTATE = {
        CREATED: 0,
        LOADING: 1,
        LOADED: 2,
        ERROR: -1
    };

    var STATE = {
        NEW: 0,
        CREATED: 1,
        DELETED: -1
    };

    var Model = Entity.inherit("js.data.Model", {
        ctor: function (attributes) {

            // stores the current fetch state
            this._fetch = {
                callbacks: [],
                state: FETCHSTATE.CREATED
            };

            this.callBase(attributes);
        },

        schema: {
            created: Date
        },

        $isDependentObject: false,

        /***
         *
         * persistent the model over the data-source in which it was created
         *
         * @param options
         * @param callback
         */
        save: function (options, callback) {

            // TODO: handle multiple access
            try {
                var status = this._status();

                if (status === STATE.NEW || status === STATE.CREATED) {
                    this.$context.$dataSource.saveModel(this, options, callback);
                } else {
                    throw "status '" + status + "' doesn't allow save";
                }
            } catch (e) {
                if (callback) {
                    callback(e);
                }
            }

        },

        validateAndSave: function(options, callback) {
            var self = this;

            flow()
                .seq(function(cb) {
                    self.validate(options, cb);
                })
                .seq(function(cb) {
                    self.save(options, cb)
                })
                .exec(callback);
        },

        getCollection: function(key){
            var schemaDefinition = this.schema[key];
            if (!schemaDefinition) {
                throw "Couldn't find '" + key + "' in schema";
            }
            var collection = this.get(key);
            if(!collection){
                var context = this.getContextForChild(schemaDefinition.type);
                if(context){
                    collection = context.createCollection(schemaDefinition.type, null);
                    collection.$parent = this;
                    this.set(key, collection);
                }else{
                    throw "Couldn't determine context for " + key;
                }
            }
            return collection;


        },

        prepare: function(attributes, action) {
            attributes = this.callBase();

            if (action === "create") {
                // remove id
                delete(attributes.id);
            }

            return attributes;

        },

        /**
         * @param options
         * @param options.fetchSubModels
         * @param {Function} callback - function(err, model, options)
         */
        fetch: function (options, callback) {
            options = options || {};

            var self = this;

            if (this._fetch.state === FETCHSTATE.LOADING) {
                // currently fetching -> register callback
                this._fetch.callbacks.push(function (err, model) {
                    modelFetchedComplete(err, model, options, callback);
                });
            } else if (this._fetch.state == FETCHSTATE.LOADED) {
                // completed loaded -> execute
                modelFetchedComplete(null, this, options, callback);
            } else {
                // set state and start loading
                self._fetch.state = FETCHSTATE.LOADING;

                this.$context.$dataSource.loadModel(this, options, function (err, model) {
                    self._fetch.state = err ? FETCHSTATE.ERROR : FETCHSTATE.LOADED;

                    // execute callbacks
                    modelFetchedComplete(err, model, options, callback);

                    _.each(self._fetch.callbacks, function (cb) {
                        cb(err, model);
                    });

                });
            }
        },
        remove: function (options, callback) {
            // TODO: handle multiple access
            try {
                var status = this._status();
                var self = this;
                if (status === STATE.CREATED) {
                    this.$context.$dataSource.removeModel(this, options, function(err){
                        if(!err){
                            self.set('id', false);
                        }
                        callback && callback(err);
                    });
                } else {
                    throw "status '" + status + "' doesn't allow delete";
                }
            } catch(e) {
                callback && callback(e);
            }
        },

        _status: function () {
            if (this.$.id === false) {
                return STATE.DELETED;
            } else {
                return this.$.id ? STATE.CREATED : STATE.NEW;
            }
        }.onChange('id'),
        isNew: function(){
            return this._status() === STATE.NEW;
        }.onChange('id')
    });

    function fetchSubModels(attributes, subModelTypes, delegates) {
        _.each(attributes, function (value, key) {
            if (value instanceof Model) {
                // check if the model is required
                var subModelTypeEntry = subModelTypes[key];

                if (subModelTypeEntry) {
                    // model required -> create delegate
                    subModelTypeEntry.found = true;

                    delegates.push(function (cb) {
                        value.fetch({
                            fetchSubModels: subModelTypeEntry.subModels
                        }, cb);
                    });
                }
            } else if (value instanceof Object) {
                // TODO: causes in some cases an unfinity loop
                // fetchSubModels(value, subModelTypes, delegates);
            }
        });
    }

    function modelFetchedComplete(err, model, options, originalCallback) {

        var callback = function (err, model) {
            if (originalCallback) {
                originalCallback(err, model, options)
            }
        };

        if (err) {
            callback(err, model);
        } else {

            var delegates = [];

            if (options.fetchSubModels && options.fetchSubModels.length > 0) {

                // for example fetch an article with ["currency", "product/design", "product/productType"]
                var subModels = Model.createSubModelLoadingChain(model, options.fetchSubModels);

                fetchSubModels(model.$, subModels, delegates);

                // check that all subResources where found
                var missingSubModels = _.filter(subModels, function (subModel) {
                    return !subModel.found;
                });

                if (missingSubModels.length > 0) {
                    // TODO load again with fullData=true if not laoded with fullData=false
                    this.log(["requested submodel missing", missingSubModels], "warn");

                    callback("requested submodel missing", model);
                    return;
                }
            }

            // execute all delegates in parallel and then execute callback
            flow()
                .par(delegates)
                .exec(function (err) {
                    callback(err, model);
                });
        }
    }

    Model.createSubModelLoadingChain = function (model, subModels) {
        var ret = {},
            subModelParser = /^([\w][\w.]*)(?:\/([\w][\w.]*))?$/;

        _.each(subModels, function (item) {
            var parts = subModelParser.exec(item);
            if (parts) {
                var subModelType = parts[1];
                var subModelSubType = parts[2];

                var subModelTypeEntry = ret[subModelType];
                if (!subModelTypeEntry) {
                    // create an entry
                    subModelTypeEntry = {
                        type: subModelType,
                        found: false,
                        subModels: []
                    };
                }

                // add required subModelTypeStrings
                if (subModelSubType) {
                    subModelTypeEntry.subModels.push(subModelSubType);
                }
                ret[subModelType] = subModelTypeEntry;
            }
        });

        return ret;
    };

    Model.STATE = STATE;
    Model.FETCHSTATE = FETCHSTATE;

    return Model;
});