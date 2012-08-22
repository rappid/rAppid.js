define(["js/ui/SelectionView", "underscore"], function (SelectionView, _) {
        return SelectionView.inherit("js.html.Select", {
            defaults: {
                multiSelect: false,
                forceSelectable: false,
                tagName: 'select'
            },
            $defaultTemplateName: 'item',
            _renderMultiSelect: function (multiSelect) {
                this.$el.multiple = multiSelect;
            },
            _bindDomEvents: function () {
                var self = this;
                this.bindDomEvent('change', function (e) {
                    self._checkOptions();
                });
            },
            _checkOptions: function () {
                for (var i = 0; i < this.$children.length; i++) {
                    this.$children[i].set({selected: this.$children[i].$el.selected});
                }
            }
        });
    }
);