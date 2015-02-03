define(['require', 'js/core/Bindable', 'js/core/List', 'flow', 'js/data/validator/Validator', 'underscore'],
    function (require, Bindable, List, flow, Validator, _) {

        var undefined;

        var ValidationErrors = Bindable.inherit('js.data.Entity.ValidationErrors', {
            firstError: function () {
                for (var key in this.$) {
                    if (this.$.hasOwnProperty(key) && this.$[key]) {
                        return this.$[key];
                    }
                }
                return null;
            }.on('change'),
            size: function () {
                return  _.size(this.$);
            }.on('change')
        });

        var FieldTransformer = Bindable.inherit('js.data.Entity.FieldTransformer', {
            defaults: {
                fields: null
            },

            transformValue: function (field, value, schemaObject) {
                var fields = this.$.fields;
                if (!fields || fields.length === 0 || (!!fields.length && fields.indexOf(field))) {
                    return this._transformValue(field, value, schemaObject);
                }
                return value;
            },
            _transformValue: function (field, value, schemaObject) {
                return value;
            }

        });

        var SchemaValidator = Validator.inherit('js.data.validator.SchemaValidator', {
            validate: function (entity, options, callback) {
                if (options instanceof Function) {
                    callback = options;
                    options = {};
                }

                options = options || {};


                var errors = [],
                    subEntities = [],
                    attributes = entity.$,
                    schema = entity.schema,
                    schemaObject,
                    value,
                    type, err;

                try {
                    for (var key in schema) {
                        if (schema.hasOwnProperty(key)) {

                            if (options.fields && options.fields.length > 0) {
                                if (options.fields.indexOf(key) === -1) {
                                    continue
                                }
                            }
                            value = entity.getTransformedValue(key);
                            schemaObject = schema[key];

                            type = schemaObject.type;

                            // TODO: add idField validator with this reg ex ^(?:[\w\-](?<!_))+$
                            if (this._isUndefined(value, schemaObject) && this._isRequired(entity, schemaObject)) {
                                errors.push(this._createError("isUndefinedError", key + " is required", key));
                            } else if (value && !this._isValidType(value, schemaObject.type)) {
                                errors.push(this._createError("wrongTypeError", key + " is from wrong type", key));
                            } else if (value instanceof Entity && value.$isEntity && !schemaObject.isReference) {
                                subEntities.push({
                                    key: key,
                                    value: value
                                });
                            } else if (value instanceof List && !value.isCollection) {
                                if (value.size() > 0 && value.at(0) instanceof Entity) {
                                    for (var i = 0; i < value.$items.length; i++) {
                                        subEntities.push({
                                            key: key,
                                            value: value.$items[i]
                                        });
                                    }
                                } else if (value.size() === 0 && !(this.runsInBrowser() && schemaObject.generated) && this._isRequired(entity, schemaObject.required) === true) {
                                    errors.push(this._createError("isEmptyError", key + " are empty", key));
                                }
                            }
                        }
                    }
                } catch (e) {
                    err = e || true;
                }

                var self = this,
                    subOptions = {
                        setErrors: options.setErrors,
                        reset: options.reset
                    };

                flow()
                    .seq(function () {
                        if (err) {
                            throw err;
                        }
                    })
                    .seqEach(subEntities, function (subEntity, cb) {
                        entity.validateSubEntity(subEntity.value, subOptions, function (err, results) {
                            if (results) {
                                errors.push(self._createError("associationError", subEntity.key + " is not valid", subEntity.key));
                            }
                            cb(err);
                        });
                    })
                    .exec(function (err) {

                        callback(err, errors);
                    });
            },

            _isValidType: function (value, type) {

                if (type === String && !_.isString(value)) {
                    return false;
                } else if (type === Number && !_.isNumber(value)) {
                    return false;
                } else if (type === Boolean && !_.isBoolean(value)) {
                    return false;
                } else if (type === Array && !(value instanceof List || value instanceof Array)) {
                    return false;
                } else if (type === Date && !(value instanceof Date)) {
                    return false;
                } else if (type.classof && type.classof(Entity) && !(value instanceof type)) {
                    return false;
                } else if (type === Object && !_.isObject(value)) {
                    return false;
                }
                return true;
            },

            _isUndefined: function (value, schemaObject) {
                var type = schemaObject.type;
                if (type && type.isCollection) {
                    return false;
                }
                return (!(this.runsInBrowser() && schemaObject.generated)) && (value === undefined || value === null || value === "");
            },

            _isRequired: function (entity, schemaObject) {

                if (schemaObject.type && schemaObject.type.prototype && schemaObject.type.prototype.isCollection) {
                    return false;
                }

                var required = schemaObject.required;

                if (required instanceof Function) {
                    return required.call(entity);
                } else {
                    return required;
                }
            }
        });

        var Entity = Bindable.inherit('js.data.Entity', {

            ctor: function () {
                this.$errors = new ValidationErrors();
                this.$entityInitialized = false;

                this._extendValidators();
                this._extendTransformers();
                this._extendSchema();

                this.callBase();
            },
            /**
             * The schema of the entity
             */
            schema: {},
            /**
             * An array of validators to apply
             */
            validators: [
                new SchemaValidator()
            ],

            // An Array of field transformers
            transformers: [],
            /**
             * The field for the id. Is automatically added to the schema as String
             */
            idField: "id",
            /**
             * The created field. Is automatically added to the schema with Date
             */
            createdField: false,

            /**
             * The updated field. Is automatically added to the schema with Date
             */
            updatedField: false,
            /**
             * The context of the entity
             */
            $context: null,
            $dependentObjectContext: null,

            // TODO: merge this together
            $isEntity: true,
            $isDependentObject: true,

            _extendValidators: function () {

                if (this.factory.validators) {
                    this.validators = this.factory.validators;
                    return;
                }

                this.validators = this.validators || [];

                var base = this.base;

                while (base.factory.classof(Entity)) {
                    var baseValidator = base.validators;

                    for (var i = 0; i < baseValidator.length; i++) {
                        var validator = baseValidator[i];

                        if (_.indexOf(this.validators, validator) === -1) {
                            this.validators.push(validator);
                        }
                    }

                    base = base.base;
                }

                this.factory.validators = this.validators;

            },

            _extendTransformers: function () {

                if (this.factory.transformers) {
                    this.transformers = this.factory.transformers;
                    return;
                }

                this.transformers = this.transformers || [];

                var base = this.base;

                while (base.factory.classof(Entity)) {
                    var baseTransformer = base.transformers;

                    for (var i = 0; i < baseTransformer.length; i++) {
                        var transformer = baseTransformer[i];

                        if (_.indexOf(this.transformers, transformer) === -1) {
                            this.transformers.push(transformer);
                        }
                    }

                    base = base.base;
                }

                this.factory.transformers = this.transformers;
            },


            /**
             * Constructs the schema with the schema definition
             * @private
             */
            _extendSchema: function () {

                if (this.factory.schema) {
                    this.schema = this.factory.schema;
                    return;
                }
                var base = this.base;

                while (base.factory.classof(Entity)) {
                    var baseSchema = base.schema;
                    for (var type in baseSchema) {
                        if (baseSchema.hasOwnProperty(type) && !this.schema.hasOwnProperty(type)) {
                            this.schema[type] = baseSchema[type];
                        }
                    }
                    base = base.base;
                }

                var schemaDefaults = {
                    required: true,
                    includeInIndex: false,
                    serverOnly: false,
                    _rewritten: true,
                    // if true, sub models get composed and not just linked
                    compose: false
                }, schemaObject;

                // add id schema
                if (this.idField && !this.schema.hasOwnProperty(this.idField)) {
                    this.schema[this.idField] = {
                        type: String,
                        required: false,
                        serverOnly: false,
                        includeInIndex: true,
                        generated: true
                    };
                }

                if (this.updatedField && !this.schema.hasOwnProperty(this.updatedField)) {
                    this.schema[this.updatedField] = {
                        type: Date,
                        required: false,
                        serverOnly: false,
                        includeInIndex: true,
                        generated: true
                    };
                }

                if (this.createdField && !this.schema.hasOwnProperty(this.createdField)) {
                    this.schema[this.createdField] = {
                        type: Date,
                        required: false,
                        includeInIndex: true,
                        serverOnly: false,
                        generated: true
                    };
                }

                // rewrite schema
                for (var key in this.schema) {
                    if (this.schema.hasOwnProperty(key)) {
                        schemaObject = this.schema[key];
                        if (_.isString(schemaObject) || schemaObject instanceof Array || schemaObject instanceof Function) {
                            schemaObject = {
                                type: schemaObject
                            };
                            this.schema[key] = schemaObject;
                        }
                        if (_.isString(schemaObject.type)) {
                            schemaObject.type = require(schemaObject.type.replace(/\./g, "/"));
                        }
                        _.defaults(schemaObject, schemaDefaults);
                        schemaObject._key = key;
                    }
                }
                this.factory.schema = this.schema;
            },

            /***
             * Returns the correct context for a child factory
             * @param {Function} childFactory
             * @return {js.data.DataSource.Context}
             */
            getContextForChild: function (childFactory) {

                if (this._isChildFactoryDependentObject(childFactory)) {
                    // dependent object, which should be cached in context of the current entity
                    if (!this.$dependentObjectContext) {

                        if (this.$parentEntity) {
                            // entity itself lives inside a model
                            this.$dependentObjectContext = this.$parentEntity._createDependentObjectCache();
                        } else {
                            // create a new non-cached context for dependent objects
                            this.$dependentObjectContext = this._createDependentObjectCache()
                        }
                    }

                    return this.$dependentObjectContext;
                }


                return this.$context.$dataSource.getContextForChild(childFactory, this.$isDependentObject ? this.$context.$contextModel : this);
            },

            /**
             * Returns the transformed value of a field
             *
             * @param {String} key
             * @param {Object|js.core.Bindable} [scope]
             * @returns {*}
             */
            getTransformedValue: function (key, scope) {
                var value = this.get(key, scope);
                if (key && this.schema[key]) {
                    for (var i = 0; i < this.transformers.length; i++) {
                        value = this.transformers[i].transformValue(key, value, this.schema[key]);
                    }
                }
                return value;
            },

            /**
             * Transforms one value and sets it on the entity
             *
             * @param {String} field
             * @param {Object} [options]
             */
            transformValue: function (field, options) {
                this.set(field, this.getTransformedValue(field), options);
            },

            /**
             * Transforms all values defined in the schema
             * @param {Object} [options]
             */
            transformValues: function (options) {
                var ret = {};
                for (var k in this.schema) {
                    if (this.schema.hasOwnProperty(k)) {
                        ret[k] = this.getTransformedValue(k);
                    }
                }

                this.set(ret, options);
            },

            _createDependentObjectCache: function () {

                if (!this.$dependentObjectContext) {
                    this.$dependentObjectContext = this.$context.$dataSource.createContext(this, null, this.$context);
                }

                return this.$dependentObjectContext;

            },

            /**
             * Creates an entity in the context of the given entity
             * @param {Function} childFactory
             * @param {String|Number} [id]
             * @return {js.data.Entity}
             */
            createEntity: function (childFactory, id) {
                var context = this.getContextForChild(childFactory);

                return context.createEntity(childFactory, id);
            },

            _isChildFactoryDependentObject: function (childFactory) {
                return childFactory && childFactory.prototype.$isDependentObject;
            },

            /**
             * Parses the data. Can be overridden to change parsed data.
             *
             * @param {Object} data - the data parsed by the processor
             * @param {String} [action] - the action of the data source ("create", "save", "update" or "delete")
             * @param {String} [options] - some options
             */
            parse: function (data, action, options) {
                return data;
            },

            /***
             * Composes the data based on the schema.
             * Can pe used to pre compose the data for the processor
             * @param {String} action - "create", "save", "update" or "delete"
             * @param {Object} options
             * @return {Object} all data that should be serialized
             */
            compose: function (action, options) {
                var ret = {};
                for (var k in this.$) {
                    if (this.$.hasOwnProperty(k)) {
                        ret[k] = this.getTransformedValue(k);
                    }
                }
                return ret;
            },

            /***
             * Clears all errors
             */
            clearErrors: function () {
                this.$errors.clear();
                this.trigger('isValidChanged', {}, this);
            },

            /***
             * Returns the errors of the entity
             * @param {String} field
             * @return {js.core.Bindable}
             */
            errors: function () {
                return this.$errors;
            }.on('isValidChanged'),

            /**
             * Returns the error for a given field
             * @param {String} field - the name of the field
             * @returns {*}
             */
            fieldError: function (field) {
                return this.$errors.$[field];
            }.on('isValidChanged'),

            /***
             * Returns true if valid
             *
             * @return {Boolean}
             */
            isValid: function () {
                var $ = this.$errors.$;
                for (var key in $) {
                    if ($.hasOwnProperty(key)) {
                        if ($[key]) {
                            return false;
                        }
                    }
                }

                return true;
            }.on('isValidChanged'),

            /***
             * Validates the entity.
             * If there are asynchronous validators applied use the callback to get notified when validation has finished.
             *
             * @param {Object} [options]
             * @param {Boolean} [options.setErrors = true] - apply errors to entity
             * @param {Array} [options.fields = null] - fields to validate
             * @param {Boolean} [options.reset = true] - clears all errors before setting new
             * @param {Function} [callback]
             */
            validate: function (options, callback) {
                if (options instanceof Function) {
                    callback = options;
                    options = {};
                }

                options = options || {};

                _.defaults(options, {
                    setErrors: true,
                    reset: true,
                    fields: null
                });

                var self = this;

                var validators = [], validator;
                for (var i = 0; i < this.validators.length; i++) {
                    validator = this.validators[i];
                    if (options.fields && options.fields.length > 0) {
                        if (options.fields.indexOf(validator.$.field) > -1 || validator.$.field == null) {
                            validators.push(validator);
                        }
                    } else {
                        validators.push(validator);
                    }
                }

                var validationErrors = [];

                flow()
                    .parEach(validators, function (validator, cb) {
                        validator.validate(self, options, function (err, result) {
                            if (!err && result) {
                                if (result instanceof Validator.Error) {
                                    validationErrors.push(result);
                                } else if (result instanceof Array) {
                                    validationErrors = validationErrors.concat(result);
                                }
                            }
                            cb(err);
                        });
                    })
                    .exec(function (err) {
                        if (options.setErrors === true) {
                            self._setErrors(validationErrors, options);
                        }
                        callback && callback(err, validationErrors.length === 0 ? null : validationErrors);
                    });

            },

            // TODO: combine _setError and _setErrors
            _setError: function (field, error) {

                if (field instanceof Object) {
                    this.$errors.set(field);
                } else {
                    this.$errors.set(field, error);
                }

                this.trigger('isValidChanged');
            },

            /***
             *
             * @param {Array} errors
             * @param {Object} options
             * @private
             */
            _setErrors: function (errors, options) {
                if (options.fields && options.fields.length) {
                    var field;
                    for (var j = 0; j < options.fields.length; j++) {
                        field = options.fields[j];
                        this.$errors.unset(field);
                    }
                } else {
                    this.$errors.clear();
                }


                var error;
                try {
                    for (var i = 0; i < errors.length; i++) {
                        error = errors[i];
                        if (error.$.field && !this.$errors.$.hasOwnProperty(error.$.field)) {
                            this.$errors.set(error.$.field, error);
                        } else if (!this.$errors.$.hasOwnProperty('_base')) {
                            this.$errors.set('_base', error);
                        }
                    }
                } catch (e) {
                    this.log(e, 'warn');
                }
                this.trigger('isValidChanged');
            },
            /**
             * Returns the error for a given field
             * @deprecated
             * @param {String} field - the name of the field
             * @returns {*}
             */
            error: function (field) {
                if (field) {
                    return this.$errors.get(field);
                }
                return null;
            },
            /**
             * Validates a sub entity
             * @param {js.data.Entity} entity
             * @param {Object} options
             * @param {Function} callback
             */
            validateSubEntity: function (entity, options, callback) {
                if (entity instanceof Entity) {
                    entity.validate(options, callback);
                } else {
                    callback("parameter is not an entity");
                }
            },
            /**
             * Clones the entity with all attributes on this.$
             *
             * @returns {js.data.Entity}
             */
            clone: function () {
                var ret = this.callBase();
                ret.$context = this.$context;
                ret.$parent = this.$parent;
                return ret;
            },
            _cloneAttribute: function (value, key) {

                // don't clone a list of model references!
                if (value instanceof List) {
                    if (this.schema.hasOwnProperty(key)) {
                        var type = this.schema[key].type;
                        if (type instanceof Array && type.length && type[0].classof && type[0].classof(Entity) && !type[0].prototype.$isEntity) {
                            var list = new List();
                            list._$source = value;
                            list.add(value.$items);
                            return list;
                        }
                    }
                } else if (value instanceof Entity && !value.$isEntity) {
                    // don't clone linked models
                    return value;
                }

                return this.callBase();
            },
            /***
             * The init method can be used to setup/init an entity asynchronously.
             * It must be called from outside by hand.
             *
             * @param {Function} callback
             */
            init: function (callback) {
                callback && callback();
            },
            /**
             * Returns the value of the idField
             * @returns {*}
             */
            identifier: function () {
                return this.$[this.idField];
            },
            /**
             * Returns the context model if the context is set
             * @returns {js.data.Entity}
             */
            contextModel: function () {
                return this.$context ? this.$context.$contextModel : null;
            }
        });


        Entity.SchemaValidator = SchemaValidator;
        Entity.FieldTransformer = FieldTransformer;

        return Entity;

    });