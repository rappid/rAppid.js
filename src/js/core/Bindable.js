rAppid.defineClass("js.core.Bindable", ["js.core.EventDispatcher", "underscore"],
    /**
     * @export js.core.Bindable
     */
    function (EventDispatcher, _) {
        /**
         * @class js.core.Bindable
         * @extends js.core.EventDispatcher
         */
        return EventDispatcher.inherit({
            ctor: function (attributes) {
                // call the base class constructor
                this.base.ctor.callBase(this);

                this.$ = {};
                this._previous$ = {};


                this._allEventAttributes = (this.base._eventAttributes || []).concat(this._eventAttributes);

                attributes = attributes || {};
                _.defaults(attributes, this._defaultAttributes());
                this.set(attributes, {silent:true});

                this._previous$ = _.clone(this.$);
            },

            _defaults: {},

            _defaultAttributes: function () {
                return _.defaults(this._defaults, this.base._defaults);
            },
            /**
             * an array of attributes names, which will expect handler functions
             */
            _eventAttributes: [],

            _isEventAttribute: function (attributeName) {

                return this._allEventAttributes.indexOf(attributeName) != -1
            },


            /**
             *
             * @param attributes
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
                return this.$;
            },
            _commitChangedAttributes: function(attributes){
                if(_.size(attributes) > 0){
                    this.trigger('change',attributes,this);
                }
            },
            unset: function(key,options){
                (options || (options = {})).unset = true;
                return this.set(key, null, options);
            },
            clear: function(){
                this.set(this.$,{unset: true});
            }
        });
    });