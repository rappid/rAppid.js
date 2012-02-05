rAppid.defineClass("js.core.Template", ["js.core.Component"],
    function (Component) {
        // this is because circular dependency

        return Component.inherit({
            _initializeDescriptor:function (descriptor) {
                var node;
                // sets the first node as descriptor for component
                for (var i = 0; i < descriptor.childNodes.length; i++) {
                    node = descriptor.childNodes[i];
                    if (node.nodeType == 1) { // Elements
                        this.$componentDescriptor = node;
                        break;
                    }
                }
                if(!this.$componentDescriptor){
                    throw "No Component Descriptor defined in Template!";
                }
                return [];
            },
            _createChildrenFromDescriptor:function (descriptor) {
               // doesn't need to
            },
            createComponent:function() {
                return this._createComponentForNode(_.clone(this.$componentDescriptor));
            }
        });
    });