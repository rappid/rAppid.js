rAppid.defineClass("js.ui.ItemRenderer",
    ["underscore", "js.core.Component", "js.html.DomElement"], function (_, Component, DomElement) {
        return Component.inherit({
            /*
            _initializeDescriptor: function(descriptor){
                this.base._initializeChildren.callBase(this,children);
                var child;
                for (var i = 0; i < children.length; i++) {
                    child = children[i];
                    if(child instanceof DomElement){
                        this.$viewDescriptor = child.$descriptor;
                        break;
                    }
                }
                if(!this.$viewDescriptor){
                    throw "No DomElement specified for ItemRenderer!";
                }
            },    */
            _initializeDescriptor: function(descriptor){
                var node;
                // find the first node element and set as item viewDescriptor
                for (var i = 0; i < descriptor.childNodes.length; i++) {
                    node = descriptor.childNodes[i];
                    if (node.nodeType == 1) { // Elements
                        this.$viewDescriptor = node;
                        break;
                    }
                }

                return [];
            },
            _createChildrenFromDescriptor: function(descriptor){

            },
            createDomElementForItem: function(item){
                // var element = document.createElement(this.$viewDescriptor.tagName);

                var comp = this._createComponentForNode(_.clone(this.$viewDescriptor));
                comp.item = item;
                comp.$parent = this.$parent;


                return comp;
            }
        });
    }
);