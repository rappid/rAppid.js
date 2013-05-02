define(["xaml!js/ui/MenuButton"], function (MenuButton) {

    return MenuButton.inherit("js.ui.SplitButtonClass", {

        $defaultContentName: 'menu',

        defaults: {
            menuClassName: "dropdown-menu right"
        },

        _renderType: function (type) {
            this.$toggleButton.set({type: type});
            this.$button.set({type: type});
        },

        _renderHref: function (href) {
            this.$button.set({href: href});
        },

        _collectButton: function (child) {
            if (child.$['class'].indexOf("dropdown-toggle") > -1) {
                this.$toggleButton = child;
            } else {
                this.$button = child;
            }

        }

    });

});