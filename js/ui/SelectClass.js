define(["js/ui/View", 'js/data/Collection', 'js/core/List'], function (View, Collection, List) {
        var undefined,
            instances = [];

        return View.inherit('js.ui.SelectClass', {
            defaults: {
                componentClass: 'select',
                open: false,
                selectedItem: null,
                searchTerm: "",
                placeHolder: 'Select Something',
                searchPlaceHolder: '',
                queryCreator: null,
                itemHeight: 30,
                dropDownHeight: 200
            },

            ctor: function () {
                this.callBase();
                this.bind('tileList.selectedItems', 'add', this._onSelectedItemsChange, this);
                this.bind('tileList.selectedItems', 'remove', this._onSelectedItemsChange, this);
                this.bind('tileList.selectedItems', 'reset', this._onSelectedItemsChange, this);
                this.bind('change:searchTerm', this._onSearchTermChange, this);
                instances.push(this);
            },

            _initializationComplete: function () {
                this.$.tileList.addChild(this.getTemplate('renderer'));
                this.callBase();
            },

            _bindDomEvents: function (el) {
                this.callBase();
                var self = this;

                this.dom(this.$stage.$document).bindDomEvent('click', function (e) {
                    self.set({open: false});
                });
            },

            _onKeyDown: function (e) {
                if (e.domEvent.keyCode === 40 || e.domEvent.keyCode === 38) {
                    if (this.$.tileList.$.data.size() > 0) {
                        this.$.tileList._onKeyDown(e);
                    }
                }
                if (e.domEvent.keyCode === 13) {
                    this._onEnter(e);
                    e.target.$el.blur();
                }
            },
            _onContainerSelect: function (e) {
                e.stopPropagation();
            },
            _onEnter: function (e) {
                if (e.domEvent.keyCode === 13) {
                    this._select();
                    e.stopPropagation();
                }
            },

            _onListClick: function (e) {
                this._select();
                e.stopPropagation();
            },

            _select: function () {
                if (this.$.tileList.$.selectedItems.size() > 0) {
                    this.set({
                        'selectedItem': this.$.tileList.$.selectedItems.at(0),
                        'open': false
                    });
                    this.$.selector.$el.focus();
                } else {
                    this.set('selectedItem', null);
                }
            },

            _onSelectedItemsChange: function (e) {

            },

            _clearSelection: function (e) {
                this.set('selectedItem', null);
                e.stopPropagation();
            },

            _renderSelectedItem: function (item) {
                if (item) {
                    this._renderTemplateToPlaceHolder('selectedItem', 'selectedItem', {item: item});
                } else {
                    this._renderTemplateToPlaceHolder('emptySelection', 'emptySelection', {});
                }
            },

            _onSearchTermChange: function (e) {
                if (this.$searchTimeout) {
                    clearTimeout(this.$searchTimeout);
                }
                var self = this;
                this.$searchTimeout = setTimeout(function () {
                    self._search();
                }, 200);
            },

            _search: function () {
                if (this.$.searchTerm && this.$.searchTerm.length > 1) {
                    if (this.$.data instanceof Collection) {
                        this.queryList(this.$.searchTerm);
                    } else if (this.$.data instanceof List) {
                        this.filterList(this.$.searchTerm);
                    }
                } else if (this.$realData) {
                    this.set('data', this.$realData);
                }
                clearTimeout(this.$searchTimeout);
                this.$searchTimeout = undefined;
            },

            queryList: function (searchTerm) {
                if (!this.$realData) {
                    this.$realData = this.$.data;
                }
                this.set({scrollTop: 0, data: this.$.data.query(this.createQuery(searchTerm))});
            },

            createQuery: function (searchTerm) {
                if (this.$.queryCreator) {
                    return this.$.queryCreator(searchTerm);
                }
                // needs to be implemented
                return {};
            },
            filterList: function (searchTerm) {

            },
            _handleSelect: function (e) {
                for (var i = 0; i < instances.length; i++) {
                    if (instances[i] != this) {
                        instances[i].set({open: false});
                    }
                }
                this.set('open', !this.$.open);
                e.stopPropagation();
            },
            _handleKey: function (e) {
                if (!this.$.open && (e.domEvent.keyCode === 40 || e.domEvent.keyCode === 38)) {
                    this.set('open', true);
                    e.stopPropagation();
                } else if (e.domEvent.keyCode === 13) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            },
            _renderOpen: function (open) {
                if (open) {
                    if (this.$el.getBoundingClientRect) {
                        var bottom = this.$el.getBoundingClientRect().bottom;
                        var dropDownHeight = this.$.dropDownHeight;
                        var screenHeight = window.innerHeight;
                        if (bottom + dropDownHeight > screenHeight) {
                            this.addClass("open-top");
                        }
                    }
                    this.addClass('open');
                    this.$.inputField.$el.focus();
                    this.$.inputField.$el.select();

                    // too refresh view
                    this.$.tileList._updateVisibleItems(true);
                } else {
                    this.removeClass('open');
                    this.removeClass("open-top");
                }
            }
        });
    }
);