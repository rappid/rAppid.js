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
            $previous$:{},
            $: {},
            ctor: function (attributes) {
                // call the base class constructor
                this.base.ctor.callBase(this);


                _.defaults(attributes || {}, this._defaultAttributes);
                this.set(attributes,true);

                this.$previous$ = _.clone(this.$);
            },
            _defaultAttributes: {},

            /**
             *
             * @param attributes
             */
            set: function (key, value, options) {
                var attributes = {};

                if(_.String(key)){
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

                var changedAttributes = [],equal = true;
                var now = this.$;
                var val;

                for(key in attributes){
                    if(attributes.hasOwnProperty(key)){
                        // get the value
                        val = attributes[key];
                        // unset attribute or change it ...
                        options.unset ? delete now[key] : now[key] = val;
                        // if attribute has changed and there is no async changing process in the background, fire the event
                        if(options.silent === false && !_.isEqual(now[key],attributes[key])){
                            this.trigger('change:' + key, val, this);
                        }
                    }
                }

                return this.$;
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