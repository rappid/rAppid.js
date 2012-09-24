define(['js/ui/ItemsView', 'js/html/HtmlElement'], function(ItemsView, HtmlElement) {
    return ItemsView.inherit('js.ui.ListView', {
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

            component.$classAttributes.push(this.$.itemKey, this.$.indexKey);

            for (var j = 0; j < components.length; j++) {
                component.addChild(components[j]);
            }

            return component;
        }

    })
});