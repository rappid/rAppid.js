rAppid.defineClass("js.core.Template", ["js.core.Component"],
    function (Component) {
        // this is because circular dependency

        return Component.inherit({

            _initializeDescriptors: function () {
                this._childrenInitialized();
            },

            createComponents: function(attributes){
                // foreach child Descriptor
                var components = this._getChildrenFromDescriptor(this.$descriptor);

                if(attributes){
                    for (var c = 0; c < components.length; c++) {
                        components[c].set(attributes);
                    }
                }
                return components
            }
        });
    });