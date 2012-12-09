define(['js/ui/VirtualItemsView'], function(VirtualItemsView) {

    return VirtualItemsView.inherit('js.ui.TileListClass', {

        defaults: {
            heightUpdatePolicy: 'both',
            widthUpdatePolicy: 'both',
            scrollContainerClass: ""
        },

        _createRenderer: function(attributes) {
            attributes = attributes || {};
            attributes.$dataItem = null;

            var ret,
                container = this._createRenderContainer(attributes, this),
                children = this.$templates['renderer'].createComponents(null, container);

            if (container) {
                // add all children to it
                for (var i = 0; i < children.length; i++) {
                    container.addChild(children[i]);
                }
                ret = container;
            } else {
                ret = children[0];
            }

            ret && ret.set({
                position: 'absolute'
            });

            return ret;
        },

        _createRenderContainer: function(attributes, parentScope) {
            var template = this.$templates['rendererContainer'];

            if (template) {
                var container = (template.createComponents(attributes, parentScope)[0]);
                container.$classAttributes.push('item');
                return container;
            }

            return null;
        }
    });

});