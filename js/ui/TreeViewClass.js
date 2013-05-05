define(
    ["js/ui/SelectionView", "js/core/Template", "js/core/List", "js/core/Bindable", "underscore"], function (SelectionView, Template, List, Bindable, _) {

        return SelectionView.inherit({
            defaults: {
                tagName: "div",
                items: null,
                itemKey: 'item',
                indexKey: 'index',
                componentClass: "tree-view",
                keyPath: null,
                allowDeselection: true,
                childrenKey: "children",
                forceSelectable: false,
                multiSelect: true
            },

            $defaultTemplateName: null,


            /***
             * Creates a component based on the template for a given item
             * @param {Object} item
             * @param {Number} index
             * @return {js.core.Component} component
             * @private
             */
            _createComponentForItem: function (item, index) {
                var children = this.get(item, this.$.childrenKey);
                var component;
                if (children instanceof List || children instanceof Array) {

                    component = this.getTemplate("node-container").createComponents(attr)[0];

                    var attr = {};
                    attr[this._getItemKey()] = item;
                    attr[this._getIndexKey()] = index;
                    var node = this.getTemplate("node").createComponents(attr)[0];
                    if (node.$classAttributes) {
                        node.$classAttributes.push(this.$.itemKey, this.$.indexKey);
                    }

                    node.bind("on:click", function(e){
                        e.stopPropagation();

                        node.$parent.set('selected',!node.$parent.$.selected);
                    });

                    var listAttr = {
                        itemKey: this._getItemKey(),
                        indexKey: this._getIndexKey(),
                        items: children,
                        _root: this.$._root || this
                    };

                    var treeView = this.createComponent(this.factory,listAttr);

                    treeView.addChild(this.$templates["node"]);
                    treeView.addChild(this.$templates["item"]);

                    if (treeView.$classAttributes) {
                        treeView.$classAttributes.push(this.$.itemKey, this.$.indexKey);

                    }

                    component.addChild(node);
                    component.addChild(treeView);

                } else {
                    component = this.callBase();
                    component.set('selectable', true);
                    component.bind("change:selected", this._onItemSelected, this.$._root || this);
                }
                return component;
            },
            _onItemSelected: function(e){
                if(e.$){
                    if(this.$selectedItemComponent){
                        this.$selectedItemComponent.set('selected', false);
                    }
                    this.$selectedItemComponent = e.target;
                }
            }
        });
    }
);