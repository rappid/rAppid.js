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

            createEntity: function(childFactory,id){
                var context = this.getContextForChild(childFactory);

                return context.createEntity(childFactory,id);
            },

            _isChildFactoryDependentObject: function (childFactory) {
                return childFactory && childFactory.prototype.$isDependentObject;
            },

            /**
             * Parses data with a given DataSource
             * Can be overidden to add pre or post parsing of data
             * @param data
             * @param [action]
             * @param [options]
             */
            parse: function (data, action, options) {
                return data;
            },

            /***
             * composes the data for serialisation
             * @param action
             * @param options
             * @return {Object} all data that should be serialized
             */
            compose: function (action, options) {
                return this.$;
            },

            clearErrors: function () {
                this.$errors.clear();
            },

            setErrors: function (errors) {
                for (var key in errors) {
                    if (errors.hasOwnProperty(key)) {
                        this.$errors.set(key, errors[key]);
                    }
                }
            },

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