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
            // set model class name
            this.$modelClassName = this.constructor.name;

            // stores the current fetch state
            this._fetch = {
                callbacks: [],
                state: FETCHSTATE.CREATED
            };

            this.callBase(attributes);
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
                    this.$context.$datasource.saveModel(this, options, callback);
                } else {
                    throw "status '" + status + "' doesn't allow save";
                }
            } catch (e) {
                if (callback) {
                    callback(e);
                }
            }

        },


        prepare: function(attributes, action) {
            attributes = this.callBase();

            if (action === "create") {
                // remove id
                delete(attributes.id);
            }

            return attributes;

        },

        compose: function(action, options) {
            var data = this.callBase();

            var processor = this.$context.$datasource.getProcessorForModel(this, options);
            return processor.compose(data, action, options);
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

                this.$context.$datasource.loadModel(this, options, function (err, model) {
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
                    this.$context.$datasource.removeModel(this, options, function(err){
                        if(!err){
                            self.set('id', false);
                        }
                        callback(err);
                    });
                } else {
                    throw "status '" + status + "' doesn't allow delete";
                }
            } catch(e) {
                if (callback) {
                    callback(e);
                }
            }
        },

        _status: function () {
            if (this.$.id === false) {
                return STATE.DELETED;
            } else {
                return this.$.id ? STATE.CREATED : STATE.NEW;
            }
        }.onChange('id')
    });

    function fetchSubModels(attributes, subModelTypes, delegates) {
        _.each(attributes, function (value) {
            if (value instanceof Model) {
                // check if the model is required
                var subModelTypeEntry = subModelTypes[value.$alias];

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
                fetchSubModels(value, subModelTypes, delegates);
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
                var subModelTypes = Model.createSubModelLoadingChain(model, options.fetchSubModels);

                fetchSubModels(model.$, subModelTypes, delegates);

                // check that all subResources where found
                var missingSubModels = _.filter(subModelTypes, function (subModel) {
                    return !subModel.found;
                });

                if (missingSubModels.length > 0) {
                    // TODO load again with fullData=true if not laoded with fullData=false
                    console.log(["requested submodel missing", missingSubModels]);

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