define(['require', 'js/core/Bindable', 'js/core/List'],
    function (require, Bindable, List) {
        var Collection;

        var Entity = Bindable.inherit('js.core.Entity', {

            ctor: function (attributes) {
                this.$errors = new Bindable();
                this._extendSchema();

                this.callBase(attributes);
            },

            $schema: {},

            $context: null,

            $dependentObjectContext: null,

            $isDependentObject: true,

            _extendSchema: function () {
                var base = this.base;

                while (base instanceof Entity) {
                    var baseSchema = base.$schema;
                    for (var type in baseSchema) {
                        if (baseSchema.hasOwnProperty(type) && !this.$schema.hasOwnProperty(type)) {
                            this.$schema[type] = baseSchema[type];
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
             * Sets the errors for the entity
             * @param {Object} errors
             */
            setErrors: function (errors) {
                for (var key in errors) {
                    if (errors.hasOwnProperty(key)) {
                        this.$errors.set(key, errors[key]);
                    }
                }
            },
            /***
             * Returns the errors of the entity
             * @return {js.core.Bindable}
             */
            errors: function () {
                return this.$errors;
            },
            clone: function () {
                var ret = this.callBase();
                ret.$context = this.$context;
                return ret;
            }
        });


        return Entity;

    });