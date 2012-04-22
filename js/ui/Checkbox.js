define(
    ["xaml!js.ui.Link", "js.core.Content"], function (Link) {
        return Link.inherit({
            defaults: {
                'tagName': 'label',
                'componentClass': 'checkbox'
            },
            _renderLabel: function (label) {

            }
        });
    }
);