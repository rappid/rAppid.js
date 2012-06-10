define(['js/ui/ItemsView', 'js/html/HtmlElement'], function(ItemsView, HtmlElement) {
    return ItemsView.inherit('js/ui/ListView', {
        defaults: {
            tagName: 'ul'
        },

        _createComponentForItem: function (item, i) {
            var attr = {};
            attr[this._getItemKey()] = item;
            attr[this._getIndexKey()] = i;

            var components = this.$templates['item'].createComponents(attr);
            var component = this.createComponent(HtmlElement, {
                tagName: 'li'
            });

            for (var j = 0; j < components.length; j++) {
                component.addChild(components[j]);
            }

            // add to rendered item map
            this.$renderedItems.push({
                item: item,
                component: component
            });
            return component;
        }

    })
});