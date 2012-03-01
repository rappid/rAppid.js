var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.ui.SelectionView",
        ["js.ui.ItemsView", "js.html.DomElement"], function (ItemsView, DomElement) {
            return ItemsView.inherit({
                defaults: {
                    tagName: "div",
                    needsSelection: false,
                    multiSelect: false,
                    selectedViews: [],
                    selectedItems: [],
                    selectedItem: null,
                    hasSelection: false,
                    items: [],
                    forceSelectable: true
                },
                ctor: function () {
                    this.$childViews = [];
                    return this.callBase();
                },
                hasSelectedItems: function(){
                    return this.$.selectedItems.length > 0;
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
                    if (this.$.needsSelection === true && this.$.selectedItem === null && this.hasSelection() === false ) {
                        child.set({selected: true});
                    } else {
                        // get item for child, if item is in selectedItems, select child!
                        if (child.has("$item")) {
                            for (var i = 0; i < this.$.selectedItems.length; i++) {
                                if (child.$.$item === this.$.selectedItems[i] || child.$.$item === this.$.selectedItem) {
                                    child.set({selected:true});
                                    break;
                                }
                            }
                        }
                    }
                },
                _renderSelectedItem: function (item) {
                    // TODO: implement
                    // get view for item
                    // if there is a view, select the view basta!
                    // set selected
                },
                _renderSelectedIndex: function (i) {

                    if (i != null && i > -1 && i < this.$childViews.length) {
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
                    var selectedIndex, selectedItem = null;
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

                            selectedIndex = i;
                            selectedChildren.push(c);
                            if (c.has("$item")) {
                                selectedItems.push(c.$.$item);
                                selectedItem = c.$.$item;
                            }
                        }
                    }
                    if (this.$.needsSelection === true && somethingSelected === false && child.$.selected === false) {
                        child.set({selected: true});
                        correctSelection = true;
                    }

                    if (!correctSelection) {
                        this.set({selectedViews: selectedChildren, selectedItems: selectedItems, selectedIndex: selectedIndex, selectedItem: selectedItem});
                    }
                }
            });
        }
    );
});