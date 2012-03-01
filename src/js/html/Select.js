var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.html.Select",
        ["js.ui.SelectionView"], function (SelectionView) {
            return SelectionView.inherit({
                defaults:{
                    multiSelect:false,
                    forceSelectable:false,
                    tagName:'select'
                },
                _renderMultiSelect:function (multiSelect) {
                    if (multiSelect === true) {
                        this.$el.multiple = true;
                    } else {
                        this.$el.multiple = false;
                    }

                },
                _renderSelectedItems:function (items) {
                    var comp, ri;
                    // go through items, find option and set selected
                    for (var i = 0; i < this.$renderedItems.length; i++) {
                        ri = this.$renderedItems[i];
                        comp = ri.component;
                        comp.set({selected: rAppid._.contains(items, ri.item)});
                    }
                },
                _bindDomEvents:function () {
                    var self = this;
                    this.$el.addEventListener('change', function (e) {
                        self._checkOptions();
                    });
                },
                _checkOptions:function () {
                    for (var i = 0; i < this.$childViews.length; i++) {
                        this.$childViews[i].set({selected:this.$childViews[i].$el.selected});
                    }
                }
            });
        }
    );
});