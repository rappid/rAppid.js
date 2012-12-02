define(['js/ui/ItemsView', 'js/html/HtmlElement','js/ui/Tab','js/core/List'], function(ItemsView, HtmlElement, Tab, List) {
    return ItemsView.inherit('js.ui.TabViewClass', {
        defaults: {
            selectedIndex: 0,
            selectedView: null,
            tabClassName: 'nav nav-tabs',
            tabItems: List
        },
        $defaultTemplateName: null,
        initialize: function(){
            this.callBase();
            this.bind('tabSelection','change:selectedItem', this._onTabChange, this);
        },
        _renderChild: function (child) {
            if (child instanceof Tab) {
                this.$.tabItems.add(child);
                this.$.tabContent.addChild(child);
            } else {
                this.callBase();
            }
        },
        _onTabChange: function (e) {
            this.$.tabContent.set({visibleView: e.$});

        },
        _renderSelectedIndex: function (index) {
            this.$.tabSelection.set({selectedIndex: index});
        },
        _renderSelectedView: function (view) {
            this.$.tabSelection.set({selectedView: view});
        }

    })
});