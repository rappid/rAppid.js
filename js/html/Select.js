define(["js/ui/SelectionView"], function (SelectionView) {

        var renderedSelectElements = [],
            valueChecker = null,
            valueCheckInterval = 200;


        return SelectionView.inherit("js.html.Select", {
            defaults: {
                multiSelect: false,
                forceSelectable: false,
                enableAutoFillCheck: true,
                needsSelection: true,
                tagName: 'select'
            },
            $defaultTemplateName: null,

            _renderMultiSelect: function (multiSelect) {
                this.$el.multiple = multiSelect;
            },

            render: function () {
                var ret = this.callBase();

                if (this.$.enableAutoFillCheck) {
                    renderedSelectElements.push(this);
                }
                if (!valueChecker && renderedSelectElements.length > 0) {
                    valueChecker = setInterval(function () {
                        for (var i = 0; i < renderedSelectElements.length; i++) {
                            var selectElement = renderedSelectElements[i];
                            if (selectElement.isRendered() && selectElement.$lastValue != selectElement.$el.value) {
                                selectElement._checkOptions();
                                selectElement.$lastValue = selectElement.$el.value;
                            }
                        }
                    }, valueCheckInterval);
                }

                return ret;
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
                    if (child.$el.selected && !child.$.selected) {
                        child.set({selected: true});
                    } else if (!child.$el.selected && child.$.selected) {
                        deselected.push(this.$renderedChildren[i]);
                    }
                }
                for (i = 0; i < deselected.length; i++) {
                    deselected[i].set({selected: false}, {silent: true});
                }
            }
        });
    }
);