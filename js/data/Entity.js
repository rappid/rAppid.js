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

            validators: [           ],

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
            createEntity: function(childFactory,id){
                var context = this.getContextForChild(childFactory);

                return context.createEntity(childFactory,id);
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
            isValid: function(){
                return _.size(this.$errors.$) === 0;
            }.on('isValidChanged'),

            /***
             *
             * @param {Object} options
             * @param {Object} [options.setErrors=true] -
             * @param {Object} [options.fields=null] - fields to validate
             *
             * @param {Function} [callback]
             */
            validate: function(options, callback) {

                options = options || {};

                _.defaults(options, {
                    setErrors: true,
                    fields: null
                });

                var self = this;

                var validators = [], validator;
                if(options.fields && options.fields.length > 0){
                    for(var i = 0; i < this.validators.length; i++){
                        validator = this.validators[i];
                        if(options.fields.indexOf(validator.$.field) > -1){
                            validators.push(validator);
                        }
                    }
                }else{
                    validators = this.validators;
                }

                var validationErrors = [];

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
                        if(options.setErrors === true){
                            self._setErrors(validationErrors);
                        }
                        callback && callback(err || validationErrors.length === 0 ? null : validationErrors);
                    });

            },

            _setErrors: function(errors) {
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

            error: function(key){
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

        return Entity;

    });