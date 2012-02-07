rAppid.defineClass("js.core.Bindable", ["js.core.EventDispatcher", "underscore"],
    /**
     * @export js.core.Bindable
     */
    function (EventDispatcher, _) {

        /**
         * @class js.core.Bindable
         * @extends js.core.EventDispatcher
         */

        var Bindable = EventDispatcher.inherit({
            ctor: function (attributes) {
                // call the base class constructor
                this.callBase();

                this.$ = {};

                _.extend(this._eventAttributes, this.base._eventAttributes || {});

                attributes = attributes || {};
                _.defaults(attributes, this._defaultAttributes());
                this.$ = attributes;

            },
            _bindingRegex: /^\{([a-z_$][a-z0-9$_.]*)\}$/i,
            _defaults: {},

            _defaultAttributes: function () {
                return _.defaults(this._defaults, this.base._defaults);
            },
            /**
             * an array of attributes names, which will expect handler functions
             */
            _eventAttributes: {},

            _isEventAttribute: function (attributeName) {
                return this._eventAttributes.hasOwnProperty(attributeName);
            },

            _getEventTypeForAttribute: function(eventName) {
                // TODO: implement eventAttribites as hash
                return this._eventAttributes[eventName];
            },

            _isBindingDefinition: function (value) {
                return this._bindingRegex.test(value);
            },

            /**
             *
             * @param key
             * @param value
             * @param options
             */
            set: function (key, value, options) {
                var attributes = {};

                if(_.isString(key)){
                    attributes[key] = value;
                }else{
                    options = value;
                    attributes = key;
                }

                options = options|| {silent: false, unset: false};

                // for unsetting attributes
                if (options.unset) {
                    for (key in attributes) {
                        attributes[key] = void 0;
                    }
                }

                var changedAttributes = {},
                    equal = true,
                    now = this.$,
                    val;

                for(key in attributes){
                    if(attributes.hasOwnProperty(key)){
                        // get the value
                        val = attributes[key];
                        // unset attribute or change it ...
                        if(options.unset === true){
                            delete now[key];
                        }else{
                            if(!_.isEqual(now[key],attributes[key])){
                                now[key] = attributes[key];
                                changedAttributes[key] = now[key];
                                if(options.silent === false){
                                    this.trigger('change:' + key, val, this);
                                }
                            }
                        }
                        // if attribute has changed and there is no async changing process in the background, fire the event

                    }
                }
                this._commitChangedAttributes(changedAttributes);

                if(options.silent === false && _.size(changedAttributes) > 0){
                        this.trigger('change', changedAttributes, this);
                }

                return this.$;
            },
            get: function(key){
                var path = key.split(".");
                var prop = this.$[path.shift()];
                var key;
                while (path.length > 0 && prop != null) {
                    key = path.shift();
                    if (prop instanceof Bindable) {
                        prop = prop.get(key);
                    } else if (prop[key]) {
                        prop = prop[key];
                    } else {
                        throw "Couldn't find attribute for " + key;
                    }
                }
                return prop;
            },
            _commitChangedAttributes: function(attributes){

            },
            unset: function(key,options){
                (options || (options = {})).unset = true;
                return this.set(key, null, options);
            },
            clear: function(){
                this.set(this.$,{unset: true});
            }
        });

        return Bindable;

    });