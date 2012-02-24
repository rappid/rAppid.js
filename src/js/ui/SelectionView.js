var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.ui.SelectionView",
        ["underscore", "js.ui.ItemsView", "js.html.DomElement"], function (_, ItemsView, DomElement) {
            return ItemsView.inherit({
                defaults: {
                    tagName: "div",
                    needsSelection: false,
                    multiSelect: false,
                    selectedViews: [],
                    selectedItems: [],
                    hasSelection: false,
                    items: [],
                    forceSelectable: true
                },
                ctor: function () {
                    this.$childViews = [];
                    return this.callBase();
                },
                hasSelection: function () {
                    return this.$.selectedViews.length > 0;
                }.on('selectedViews'),
                addChild: function (child) {
                    if (child instanceof DomElement) {
                        this.$childViews.push(child);
                    }
                    this.callBase();
                },
                _renderChild: function (child) {
                    if (child instanceof DomElement) {
                        var self = this;
                        if(this.$.forceSelectable === true){
                            child.set({selectable:true});
                        }
                        child.on('change:selected', function (e, c) {
                            self._onChildSelected(c);
                        }, child);
                    }
                    this.callBase();
                    if (this.$.needsSelection === true && this.hasSelection() === false) {
                        child.set({selected: true});
                    }
                },
                _renderSelectedItem: function (item) {
                    // TODO: implement
                    // get view for item
                    // if there is a view, select the view basta!
                    // set selected
                },
                _renderSelectedIndex: function (i) {
                    if (i > -1 && i < this.$childViews.length) {
                        this.$childViews[i].set({selected: true});
                    }
                },
                _onChildSelected: function (child) {
                    var c, i;
                    var checkMultiSelect = (child.$.selected === true && this.$.multiSelect === false);
                    var checkMinSelect = !checkMultiSelect && (child.$.selected === false && this.$.needsSelection === true);
                    var correctSelection = false;
                    var somethingSelected = false;
                    var selectedChildren = [];
                    var selectedItems = [];
                    for (i = 0; i < this.$childViews.length; i++) {
                        c = this.$children[i];
                        if (checkMultiSelect) {
                            if (c != child && c.$.selected === true) {
                                correctSelection = true;
                                c.set({selected: false});
                            }
                        } else if (checkMinSelect) {
                            if (c.$.selected === true) {
                                somethingSelected = true;
                            }
                        }
                        if (c.$.selected === true) {

                            selectedChildren.push(c);
                            if (this.$.items.length > 0) {
                                selectedItems.push(this.$.items[i]);
                            }
                        }
                    }
                    if (this.$.needsSelection === true && somethingSelected === false && child.$.selected === false) {
                        child.set({selected: true});
                        correctSelection = true;
                    }

                    if (!correctSelection) {
                        this.set({selectedViews: selectedChildren, selectedItems: selectedItems});
                    }
                }
            });
        }
    );
});