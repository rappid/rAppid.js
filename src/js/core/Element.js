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

                this.initialize();

                this._initializeDescriptor(this.$descriptor);

                this._initializationComplete();

            },
            _initializeDescriptor: function(descriptor){

            },
            initialize: function(){

            },
            get: function(key){
                var path = key.split(".");
                // get first key
                var k1 = path[0];
                // try to find value for first key
                var value = this.$[k1];
                // if value was found
                if(value){
                    return this.callBase(key);
                // if not, ask parent
                }else if(this.$parentScope){
                    return this.$parentScope.get(key);
                }
                return null;
            },
            _preinitialize: function () {

            },
            _initializationComplete: function () {
                this.$initialized = true;
            }
        });
    }
);