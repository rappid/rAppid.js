rAppid.defineClass("js.core.Element",
    ["js.core.Bindable"], function(Bindable) {
        return Bindable.inherit({
            ctor: function (attributes) {
                this.base.ctor.callBase(this, attributes);
            },
            _construct:function (descriptor, applicationDomain, scope) {
                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;

                // initializing of the ID is a must, event in construction
                if (descriptor && descriptor.nodeType == 1) { // element
                    var id;

                    try {
                        id = descriptor.getAttribute("id");
                    } catch (e) {
                    }

                    if (id) {
                        this.$.id = id;
                    }
                }

                if (descriptor && descriptor.parentNode && !descriptor.parentNode.parentNode) {
                    // we are the root
                    scope = {};
                }

                this.$scope = scope;
            },
            setVar: function(key,value){
                this[key] = value;
            },
            getVar: function(key){
                var ret = this[key];
                if (ret) {
                    return ret;
                } else if (this.$parent) {
                    // ask base
                    return this.$parent.getVar(key);
                } else {
                    return null;
                }
            },
            /**
             *
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



                this._preinitialize();

                this._initializeDescriptor(this.$descriptor);

                this._initializationComplete();

            },
            _initializeDescriptor: function(descriptor){

            },
            _getVarForPlaceholder: function(placeholder){
                var path = placeholder.split(".");
                var prop = this.getVar(path.shift());
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
            _preinitialize: function () {

            },
            _initializationComplete: function () {
                this.$initialized = true;
            }
        });
    }
);