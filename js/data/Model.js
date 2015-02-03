define(["js/data/Entity", "js/core/List", "flow", "underscore", "js/error/ValidationError"], function (Entity, List, flow, _, ValidationError) {

    var FETCHSTATE = {
        CREATED: 0,
        LOADING: 1,
        LOADED: 2,
        ERROR: -1
    };

    var SAVESTATE = {
        CREATED: 0,
        SAVING: 1
    };

    var STATE = {
        NEW: 0,
        CREATED: 1,
        DELETED: -1
    };

    var Model = Entity.inherit("js.data.Model", {

        ctor: function (attributes, evaluateBindingsInCtor) {

            // stores the current fetch state
            this._fetch = {
                callbacks: [],
                state: FETCHSTATE.CREATED
            };

            this._save = {
                callbacks: [],
                state: SAVESTATE.CREATED
            };

            this.callBase(attributes, evaluateBindingsInCtor);
        },

        schema: {
            href: {
                type: String,
                generated: true,
                required: false,
                includeInIndex: true
            }
        },

        /**
         *  The field which will contain the href
         *  @type String
         */
        hrefField: "href",

        /***
         *  The field in which the updated date will be saved
         *  @type String
         */
        updatedField: "updated",
        /****
         * The field in which the created date will be saved
         * @type String
         */
        createdField: "created",

        /**
         * This field defines the type / class which should be used for the http response after a post returns with payload
         * The default is null
         * @type Function
         */
        resultType: null,
        /***
         * Private field to determinate if the class is Entity or Model
         * @type Boolean
         */
        $isEntity: false,
        /***
         * Private field to determinate if the class is Entity or Model
         * @type Boolean
         */
        $isDependentObject: false,

        /***
         *
         * Perstists the model over the DataSource in which it was created
         *
         * @param {Object} options
         * @param {Boolean} options.invalidatePageCache - if set to true the corresponding collection page cache is cleared
         * @param {Function} callback - The callback when save has finished
         */
        save: function (options, callback) {

            options = options || {};
            _.defaults(options, {
                invalidatePageCache: false
            });

            if (this._save.state === SAVESTATE.SAVING) {
                if (callback) {
                    // currently fetching -> register callback
                    this._save.callbacks.push(callback);
                }
            } else {
                this._save.state = SAVESTATE.SAVING;

                var self = this;

                try {
                    var status = this._status();
                    if (status === STATE.NEW || status === STATE.CREATED) {
                        this.$context.$dataSource.saveModel(this, options, function (err, result) {
                            self._save.state = err ? SAVESTATE.ERROR : SAVESTATE.CREATED;

                            if (!err && self.$collection && options.invalidatePageCache) {
                                self.$collection.invalidatePageCache();
                            }

                            callback && callback(err, result, options);

                            _.each(self._save.callbacks, function (cb) {
                                cb.call(self, err, result);
                            });

                            self._save.callbacks = [];
                        });
                    } else {
                        throw new Error("status '" + status + "' doesn't allow save");
                    }
                } catch (e) {

                    self._save.state = SAVESTATE.ERROR;

                    if (callback) {
                        callback(e);
                    }

                    _.each(self._save.callbacks, function (cb) {
                        cb.call(self, err, self);
                    });

                    self._save.callbacks = [];
                }
            }

        },
        /***
         * Validates the model before saving. If the model is valid it gets saved otherwise it returns an error in the callback.
         *
         * @param {Object} options - options for validation and saving
         * @param {Function} callback
         */
        validateAndSave: function (options, callback) {
            var self = this;

            flow()
                .seq(function (cb) {
                    self.validate(options, cb);
                })
                .seq(function (cb) {
                    if (self.isValid()) {
                        self.save(options, cb);
                    } else {
                        cb(new ValidationError("Model is not valid!", "INVALID_MODEL", "", self));
                    }
                })
                .exec(function (err) {
                    callback && callback(err, self);
                });
        },
        /**
         * Returns a sub collection of the model for a given field.
         * If the collection doesn't exist it gets created.
         * You should always use this method to get a sub collection.
         *
         * @param {String} field
         * @returns {js.data.Collection}
         */
        getCollection: function (field) {
            var schemaDefinition = this.schema[field];
            if (!schemaDefinition) {
                throw "Couldn't find '" + field + "' in schema";
            }
            var collection = this.get(field);
            if (!collection) {
                var context = this.getContextForChild(schemaDefinition.type);
                if (context) {
                    collection = context.createCollection(schemaDefinition.type, null);
                    collection.$parent = this;
                    this.set(field, collection);
                } else {
                    throw "Couldn't determine context for " + field;
                }
            }
            return collection;


        },
        /**
         * Pre-Composes the model before it goes to the DataSource processor
         *
         * @param action
         * @param options
         * @returns {*}
         */
        compose: function (action, options) {
            var ret = this.callBase();

            if (action === "create" && ret.hasOwnProperty(this.idField) && [this.idField] === null) {
                delete ret[this.idField];
            }

            return ret;
        },

        /**
         * Fetches the model over the given DataSource. The id of the model must be set.
         *
         * @param {Object} options
         * @param {Array} options.fetchSubModels - array of submodels to fetch
         * @param {Function} callback - function(err, model, options)
         */
        fetch: function (options, callback) {

            if (arguments.length === 1 && options instanceof Function) {
                callback = options;
                options = null;
            }

            options = options || {};

            var self = this;

            if (this._fetch.state === FETCHSTATE.LOADING) {
                // currently fetching -> register callback
                this._fetch.callbacks.push(function (err, model) {
                    modelFetchedComplete(err, model, options, callback);
                });
            } else if (this._fetch.state == FETCHSTATE.LOADED && !options.noCache) {
                // completed loaded -> execute
                modelFetchedComplete(null, this, options, callback);
            } else {
                // set state and start loading
                self._fetch.state = FETCHSTATE.LOADING;

                this.$context.$dataSource.loadModel(this, options, function (err, model) {
                    self._fetch.state = err ? FETCHSTATE.ERROR : FETCHSTATE.LOADED;

                    // execute callbacks
                    modelFetchedComplete.call(self, err, model, options, callback);

                    _.each(self._fetch.callbacks, function (cb) {
                        cb.call(self, err, model);
                    });

                });
            }
        },
        /**
         * Removes the model from the DataSource
         * Note: This does NOT remove the model from the collection.
         * This should be done by invalidating the page cache of the collection
         *
         * @param {Object} [options] - options for remove action
         * @param {Function} callback - The callback
         */
        remove: function (options, callback) {
            if (options instanceof Function) {
                callback = options;
                options = null;
            }
            options = options || {};
            // TODO: handle multiple access
            try {
                var status = this._status();
                var self = this;
                if (status === STATE.CREATED) {
                    this.$context.$dataSource.removeModel(this, options, function (err) {
                        if (!err) {
                            self.set('id', false);
                            if (self.$collection) {
                                self.$collection.remove(self);
                            }
                        }
                        callback && callback(err);
                    });
                } else {
                    throw new Error("status '" + status + "' doesn't allow delete");
                }
            } catch (e) {
                callback && callback(e);
            }
        },
        /**
         * Validates a sub entity
         *
         * @param {js.data.Entity} entity
         * @param {Function} callback
         */
        validateSubEntity: function (entity, callback) {
            if (entity instanceof Model) {
                // does nothing :)
                callback();
            } else {
                this.callBase();
            }
        },

        /**
         * Returns CREATED if identifier() is set, NEW if identifier is null or undefined and DELETED if identifier is false.
         * @return {Boolean}
         */
        _status: function () {
            if (this.identifier() === false) {
                return STATE.DELETED;
            } else {
                return this.identifier() ? STATE.CREATED : STATE.NEW;
            }
        }.on("change"),
        /**
         * Returns true if status is NEW
         * @return {Boolean}
         */
        isNew: function () {
            return this._status() === STATE.NEW;
        }.on("change"),

        /**
         * Returns true if status is CREATED
         * @return {Boolean}
         */
        isCreated: function () {
            return this._status() === STATE.CREATED;
        }.on("change"),

        /**
         * Converts the identifier to the given type in the schema
         * @param {String} identifier
         * @return {Number|String}
         */
        convertIdentifier: function (identifier) {
            var idField = this.idField;
            if (this.schema.hasOwnProperty(idField)) {
                var schemaObject = this.schema[idField];
                if (schemaObject.type && schemaObject.type === Number) {
                    return parseInt(identifier);
                }
            }
            return identifier;
        }
    });

    function fetchSubModels(attributes, subModelTypes, delegates) {
        _.each(attributes, function (value, key) {
            if (value instanceof Model || value instanceof require('js/data/Collection')) {
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
                originalCallback(err, model, options);
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
        var ret = {};

        _.each(subModels, function (item) {
            if (item) {
                var parts = item.split("/");
                var subModelKey = parts.shift(), subModelEntry = ret[subModelKey] || {};
                ret[subModelKey] = subModelEntry;
                subModelEntry.found = false;
                subModelEntry.type = subModelKey;
                subModelEntry.subModels = [] || subModelEntry.subModels;
                if (parts.length > 0) {
                    subModelEntry.subModels.push(parts.join("/"));
                }
            }
        });

        return ret;
    };

    Model.STATE = STATE;
    Model.FETCHSTATE = FETCHSTATE;

    return Model;
});