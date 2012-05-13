define(["js/core/Component"], function (Component) {
    // this is because circular dependency

    return Component.inherit("js.core.Template", {

        _initializeDescriptors: function () {
            this._cleanUpDescriptor(this.$descriptor);
            this._childrenInitialized();
        },

        createComponents: function (attributes, parentScope, rootScope) {
            rootScope = rootScope || this.$rootScope;
            parentScope = parentScope || this.$parentScope;
            // foreach child Descriptor
            var components = this._getChildrenFromDescriptor(this.$descriptor, null, rootScope);

            for (var c = 0; c < components.length; c++) {
                components[c].$parentScope = parentScope;
                components[c].set(attributes);
                components[c]._initialize("auto", true);

            }

            return components
        }
    });
});