define(["js/ui/SelectionView"], function (SelectionView) {
        return SelectionView.inherit("js.html.Select", {
            defaults: {
                multiSelect: false,
                forceSelectable: false,
                needsSelection: true,
                tagName: 'select'
            },
            $defaultTemplateName: null,

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
                var deselected = [],
                    child;
                // first trigger selected elements -> then deselected
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    child = this.$renderedChildren[i];
                    if(child.$el.selected){
                        child.set({selected: true});
                    } else {
                        deselected.push(this.$renderedChildren[i]);
                    }
                }
                for (i = 0; i < deselected.length; i++){
                    deselected[i].set({selected: false},{silent: true});
                }
            }
        });
    }
);