rAppid.defineClass("js.core.Element",
    ["js.core.Bindable"], function(Bindable) {
        return Bindable.inherit({
            ctor: function (attributes) {
                this.base.ctor.callBase(this);
                this.$children = [];
            },

            _construct:function (descriptor, applicationDomain) {
                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;
            },

            /**
             *
             * @param descriptor
             * @param creationPolicy
             *          auto - do not overwrite (default),
             *          all - create all children
             *          TODO none?
             */
            _initialize: function (creationPolicy) {
                if (this.$initialized) {
                    return;
                }

                this.$creationPolicy = creationPolicy || "auto";

                var descriptor = this.$descriptor;

                this._preinitialize();

                this._initializeDescriptor(descriptor);

                this._initializationComplete();

            },
            _initializeDescriptor: function(descriptor){

            },
            _getPropertyForPlaceholder: function(placeholder){
                var path = placeholder.split(".");
                var prop = this._getProperty(path.shift());
                var key;
                while(path.length > 0 && prop != null){
                    key = path.shift();
                    if(prop[key]){
                        prop = prop[key];
                    }else{
                        prop = null;
                    }
                }
                return prop;
            },
            _getProperty: function(key){
                var ret = this[key];
                if(ret){
                    return ret;
                }else if(this.$parent){
                    // ask base
                    return this.$parent._getProperty(key);
                }else{
                    return null;
                }
            },
            _preinitialize: function () {

            },
            _initializationComplete: function () {
                this.$initialized = true;
            }
        });
    }
);