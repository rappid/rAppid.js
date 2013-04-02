define(['js/ui/ItemsView', 'js/html/HtmlElement'], function(ItemsView, HtmlElement) {
    return ItemsView.inherit('js.ui.ListView', {
        defaults: {
            tagName: 'ul'
        },

        _createComponentForItem: function (item, i) {
            var attr = {};
            attr[this._getItemKey()] = item;
            attr[this._getIndexKey()] = i;

            var components = this.$templates.item.createComponents(attr);
            var component = this.createComponent(HtmlElement, {
                tagName: 'li'
            });

            for (var j = 0; j < components.length; j++) {
                components[j].$classAttributes && components[j].$classAttributes.push(this._getItemKey(), this._getIndexKey());
                component.addChild(components[j]);
            }

            return component;
        }

    });
});