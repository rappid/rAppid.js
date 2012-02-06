rAppid.defineClass("js.core.Element",
    ["js.core.Bindable"], function(Bindable) {
        return Bindable.inherit({
            ctor: function (attributes) {
               this.callBase();

                this._initializeAttributes(this.$);
            },
            _construct:function (descriptor, applicationDomain, parentScope, rootScope) {

                var attributes = this.$;

                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;

                if (descriptor && descriptor.attributes) {
                    var node;

                    for (var a = 0; a < descriptor.attributes.length; a++) {
                        node = descriptor.attributes[a];
                        attributes[node.nodeName] = node.value;
                    }
                }

                this.$ = attributes;
                this.$parentScope = parentScope || null;
                this.$rootScope = rootScope || null;

                this._initializeAttributes(this.$);

            },

            _defaults: {
                creationPolicy: "auto"
            },

            _initializeAttributes: function(attributes) {

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

                this._preinitialize();

                this._initializeDescriptor(this.$descriptor);

                this._initializationComplete();

            },
            _initializeDescriptor: function(descriptor){

            },

            _getVarForPlaceholder: function(placeholder){
                var path = placeholder.split(".");
                var prop = this.get(path.shift());
                var key;
                while(path.length > 0 && prop != null){
                    key = path.shift();
                    if(prop instanceof Bindable){
                        prop = prop.get(key);
                    }else if(prop[key]){
                        prop = prop[key];
                    }else{
                        throw "Couldn't find attribute for "+ key;
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