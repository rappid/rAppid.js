define(['js/ui/ItemsView', 'js/html/HtmlElement','js/ui/Tab','js/core/List'], function(ItemsView, HtmlElement, Tab, List) {
    return ItemsView.inherit('js.ui.TabViewClass', {
        defaults: {
            selectedIndex: null,
            selectedView: null,
            tabClassName: 'nav nav-tabs',
            menuClassName: null,
            contentClassName: null,
            tabItems: List
        },
        $defaultTemplateName: null,
        initialize: function(){
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
        _renderSelectedView: function (view) {
            this.$.tabSelection.set({selectedView: view});
        }

    })
});