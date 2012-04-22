define(["xaml!js/ui/Link", "js/core/Content"], function (Link) {
        return Link.inherit({
            defaults: {
                'componentClass': 'btn'
            },
            _renderType: function (type, oldType) {
                if (oldType) {
                    this.removeClass("btn-" + oldType);
                }
                if (type) {
                    this.addClass("btn-" + type);
                }
            }
        });
    }
);