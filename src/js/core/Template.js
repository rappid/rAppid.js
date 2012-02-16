rAppid.defineClass("js.core.Template", ["js.core.Component"],
    function (Component) {
        // this is because circular dependency

        return Component.inherit({
            _initializeDescriptor:function (descriptor) {
                var node;
                this.$childDescriptors = [];

                // sets the first node as descriptor for component
                for (var i = 0; i < descriptor.childNodes.length; i++) {
                    node = descriptor.childNodes[i];
                    if (node.nodeType == 1) { // Elements
                        this.$childDescriptors.push(node);
                    }else if(node.nodeType == 3){
                        var text = node.textContent.trim();
                        if (text.length > 0) {
                            node.textContent = text;
                            this.$childDescriptors.push(node);
                        }
                    }
                }
                if(this.$childDescriptors.length == 0){
                    throw "No Component Descriptor defined in Template!";
                }
                return [];
            },
            _createChildrenFromDescriptor:function (descriptor) {
               // doesn't need to
            },
            createComponent:function(attributes) {
                return this._createComponentForNode(_.clone(this.$childDescriptors[0]),[attributes]);
            },
            createComponents: function(attributes){
                // foreach child Descriptor
                var components = [];
                // call create Component For Node
                var node, comp;
                for(var i = 0 ; i < this.$childDescriptors.length; i++){
                    node = this.$childDescriptors[i];
                    comp = this._createComponentForNode(node,[attributes]);
                    components.push(comp);
                }
                return components
            }
        });
    });