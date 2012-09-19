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
                this.callBase();
            },
            _checkOptions: function () {
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    this.$renderedChildren[i].set({selected: this.$renderedChildren[i].$el.selected});
                }
            }
        });
    }
);