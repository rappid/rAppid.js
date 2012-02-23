var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.core.Element",
        ["js.core.Bindable", "underscore"], function (Bindable, _) {

            var undef;

            function stringToPrimitive(str) {
                // if it's not a string
                if (_.isString(str)) {

                    var n = parseFloat(str);
                    if (!_.isNaN(n)) {
                        return n;
                    }

                    if (str === "true") {
                        return true;
                    } else if (str === "false") {
                        return false;
                    }
                }
                return str;
            }

            return Bindable.inherit({
                ctor: function (attributes, descriptor, applicationDomain, parentScope, rootScope) {

                    attributes = attributes || {};

                    if (!descriptor) {
                        // created from node
                        if (!rootScope) {
                            rootScope = this;
                        }
                    }

                    this.$descriptor = descriptor;
                    this.$applicationDomain = applicationDomain;
                    this.$parentScope = parentScope || null;
                    this.$rootScope = rootScope || null;


                    _.defaults(attributes, this._getAttributesFromDescriptor(descriptor), this._getAttributesFromDescriptor(this._$descriptor));

                    this.callBase(attributes);

                    this._initializeAttributes(this.$);

                    // manually constructed
                    if (descriptor === undef || descriptor === null) {
                        this._initialize(this.$creationPolicy);
                    }

                },

                _getAttributesFromDescriptor: function (descriptor) {

                    var attributes = {};

                    if (descriptor && descriptor.attributes) {
                        var node;

                        for (var a = 0; a < descriptor.attributes.length; a++) {
                            node = descriptor.attributes[a];
                            attributes[node.nodeName] = stringToPrimitive(node.value);
                        }
                    }

                    return attributes;
                },

                defaults: {
                    creationPolicy: "auto"
                },

                _initializeAttributes: function (attributes) {
                },

                _initializeDescriptors: function () {
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

                    this._initializeDescriptors();

                    this.initialize();


//                // init descriptor of xaml component (component definition)
//                if(this._$descriptor){
//                    this._createChildrenFromDescriptor(this._$descriptor);
//                    // this._initializeChildren(childrenFromDescriptor);
//                }
//                if(this.$descriptor){
//                    this._initializeDescriptor(this.$descriptor);
//                }

                    this._initializeBindings();

                    this._initializationComplete();

                },

                _initializeBindings: function () {
                },

                _initializeDescriptor: function (descriptor) {

                },
                initialize: function () {

                },

                getScoped: function (key) {
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
});