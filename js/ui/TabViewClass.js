define(['js/ui/View', 'js/html/HtmlElement', 'js/ui/Tab', 'js/core/List'], function (View, HtmlElement, Tab, List) {
    return View.inherit('js.ui.TabViewClass', {

        defaults: {
            selectedIndex: null,
            selectedView: null,
            selectedTab: null,
            tabClassName: 'nav nav-tabs',
            menuClassName: null,
            contentClassName: null,
            tabItems: List
        },
        $defaultTemplateName: null,

        events: ['on:selectTab'],

        initialize: function () {
            this.bind('tabSelection', 'change:selectedItem', this._onSelectionChange, this);
            this.callBase();
        },

        _renderChild: function (child) {
            if (child instanceof Tab) {
                this.$.tabItems.add(child);
                this.$.tabContent.addChild(child);
            } else {
                this.callBase();
            }
        },

        removeChild: function (child) {
            if (child instanceof Tab) {
                this.$.tabItems.remove(child);
                this.$.tabContent.removeChild(child);
            } else {
                this.callBase();
            }
        },

        _renderSelectedView: function (view) {
            this.$.tabSelection.set({selectedView: view});
        },

        _onSelectionChange: function (e) {
            if (e.$) {
                this.trigger('on:selectTab', {tab: e.$});
            }
        }

    });
});