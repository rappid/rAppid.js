rAppid.defineClass("js.core.Element",
    ["js.core.Bindable"], function (Bindable) {
        return Bindable.inherit({
            ctor: function (attributes, descriptor, applicationDomain, parentScope, rootScope) {

                attributes = attributes || {};

                if (descriptor) {
                    // created from node
                    if (!rootScope) {
                        rootScope = this;
                    }
                }

                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;
                this.$parentScope = parentScope || null;
                this.$rootScope = rootScope || null;

                if (descriptor && descriptor.attributes) {
                    var node;

                    for (var a = 0; a < descriptor.attributes.length; a++) {
                        node = descriptor.attributes[a];
                        attributes[node.nodeName] = node.value;
                    }
                }

                this.callBase(attributes);

                this._initializeAttributes(this.$);

                // manually constructed
                if (!descriptor) {
                    this._initialize(this.$creationPolicy);
                }

            },

            defaults: {
                creationPolicy: "auto"
            },

            _initializeAttributes: function (attributes) {

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

                // init descriptor of xaml component (component definition)
                if(this._$descriptor){
                    this._createChildrenFromDescriptor(this._$descriptor);
                    // this._initializeChildren(childrenFromDescriptor);
                }
                if(this.$descriptor){
                    this._initializeDescriptor(this.$descriptor);

                }

                this._initializeBindings();

                this._initializationComplete();

            },

            _initializeBindings: function () {
            },

            _initializeDescriptor: function (descriptor) {

            },
            initialize: function () {

            },
            get: function (key) {
                var scope = this.getScopeForKey(key);
                if (this == scope) {
                    return this.callBase();
                } else if (scope != null) {
                    return scope.get(key);
                } else {
                    return null;
                }
            },
            getScopeForKey: function (key) {
                var path = key.split(".");
                // get first key
                var k1 = path[0];
                // try to find value for first key
                var value = this.$[k1];
                // if value was found
                if (!_.isUndefined(value)) {
                    return this;
                } else if (this.$parentScope) {
                    return this.$parentScope.getScopeForKey(k1);
                } else {
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