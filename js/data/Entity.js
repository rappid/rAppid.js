define(['require', 'js/core/Bindable', 'js/core/List', 'flow', 'js/data/validator/Validator'],
    function (require, Bindable, List, flow, Validator) {
        var Collection;

        var Entity = Bindable.inherit('js.core.Entity', {

            ctor: function (attributes) {
                this.$errors = new Bindable();
                this._extendSchema();

                this.callBase(attributes);
            },

            schema: {},

            validators: [],

            $context: null,

            $dependentObjectContext: null,

            $isDependentObject: true,

            _extendSchema: function () {
                var base = this.base;

                while (base instanceof Entity) {
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
                    _rewritten: true
                }, schemaObject;


                // rewrite schema
                for (var key in this.schema) {
                    if (this.schema.hasOwnProperty(key)) {
                        schemaObject = this.schema[key];
                        if (schemaObject instanceof Array || schemaObject instanceof Function) {
                            schemaObject = {
                                type: schemaObject
                            };
                            this.schema[key] = schemaObject;
                        }
                        if (schemaObject instanceof Object) {
                            if (schemaObject._rewritten) {
                                continue;
                            }
                        }
                        _.defaults(schemaObject, schemaDefaults);
                    }
                }
            },

            /***
             * Returns the correct context for a child factory
             * @param {Function} childFactory
             * @return {js.data.DataSource.Context}
             */
            getContextForChild: function (childFactory) {

                // TODO: this is the circle dependency. check different than use model
                if (this._isChildFactoryDependentObject(childFactory)) {
                    // dependent object, which should be cached in context of the current entity
                    if (!this.$dependentObjectContext) {
                        // create a new non-cached context for dependent objects
                        this.$dependentObjectContext = this.$context.$dataSource.createContext();
                    }

                    return this.$dependentObjectContext;
                }


                return this.$context.$dataSource.getContextForChild(childFactory, this);
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
             * Parses data
             * Can be overridden to post change parsed data
             * @param data
             * @param [action]
             * @param [options]
             */
            parse: function (data, action, options) {
                return data;
            },

            /***
             * Composes the data. Can pe used to pre compose the data for the processor
             * @param action
             * @param options
             * @return {Object} all data that should be serialized
             */
            compose: function (action, options) {
                return this.$;
            },

            /***
             * Clears all errors
             */
            clearErrors: function () {
                this.$errors.clear();
            },

            /***
             * Returns the errors of the entity
             * @param {String} field
             * @return {js.core.Bindable}
             */
            errors: function (field) {
                return this.$errors.$[field];
            }.on('isValidChanged'),

            /***
             *
             * @return {Boolean} true if valid
             */
            isValid: function () {
                return _.size(this.$errors.$) === 0;
            }.on('isValidChanged'),

            /***
             *
             * @param {Object} [options]
             * @param {Object} [options.setErrors=true] -
             * @param {Object} [options.fields=null] - fields to validate
             *
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
                    fields: null
                });

                var self = this;

                var validators = [], validator;
                for (var i = 0; i < this.validators.length; i++) {
                    validator = this.validators[i];
                    if(options.fields && options.fields.length > 0){
                        if (options.fields.indexOf(validator.$.field) > -1) {
                            validators.push(validator);
                        }
                    }else{
                        validators.push(validator);
                    }
                }

                var validationErrors = [];

                validators.unshift(new Entity.SchemaValidator());

                flow()
                    .parEach(validators, function (validator, cb) {
                        validator.validate(self, function (err, result) {
                            if (!err && result) {
                                validationErrors.push(result);
                            }
                            cb(err);
                        });
                    })
                    .exec(function (err) {
                        if (options.setErrors === true) {
                            self._setErrors(validationErrors);
                        }
                        callback && callback(err || validationErrors.length === 0 ? null : validationErrors);
                    });

            },

            _setErrors: function (errors) {
                this.$errors.clear();

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
                } catch(e) {
                    this.log(e, 'warn');
                }
                this.trigger('isValidChanged');
            },

            error: function (key) {
                if (key) {
                    return this.$errors.get(key);
                }
                return null;
            },

            clone: function () {
                var ret = this.callBase();
                ret.$context = this.$context;
                return ret;
            }
        });


        Entity.SchemaValidator = Validator.inherit('js.data.validator.SchemaValidator', {
            _validate: function (data) {
                var schema = data.schema, schemaObject, undefined, value;
                for (var key in schema) {
                    if (schema.hasOwnProperty(key)) {
                        value = data.$[key];
                        schemaObject = schema[key];
                        if (schemaObject.required === true) {
                            if (value === undefined || value === null || value === "") {
                                return new Validator.Error({
                                    errorCode: "isUndefinedError",
                                    errorMessage: key + " is required ",
                                    field: key
                                });
                            }
                        }
                        if(!this._isValidType(value,schemaObject.type)){
                            return new Validator.Error({
                                errorCode: "wrongTypeError",
                                errorMessage: key + " is not from type " + schemaObject.type,
                                field: key
                            });
                        }
                        if (value instanceof Entity && schemaObject.type.classof(Entity)) {
                            var error = this._validate(value);
                            if (error) {
                                new Validator.Error({
                                    errorCode: "associationError",
                                    errorMessage: key + " is not valid",
                                    field: key,
                                    subError: error
                                });
                            }
                        }
                    }
                }
            },
            _isValidType: function(value, type){

                if (type === String && !_.isString(value)) {
                    return false;
                } else if (type === Number && !_.isNumber(value)) {
                    return false;
                } else if (type === Boolean && !_.isBoolean(value)) {
                    return false;
                } else if (type === Array && !(value instanceof List)) {
                    return false;
                } else if( type === Date && !(value instanceof Date)) {
                    return false;
                }
                return true;
            }
        });

        return Entity;

    });