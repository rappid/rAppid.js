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

                attributes = attributes || {};
                _.defaults(attributes, this._defaults);
                this.set(attributes,{silent: true});

                this._previous$ = _.clone(this.$);
            },
            _defaultAttributes: {},
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

                var changedAttributes = {},equal = true;
                var now = this.$;
                var val;

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