define(['js/ui/ItemsView', 'js/html/HtmlElement', 'js/ui/SelectionView','js/ui/SegmentedView','js/core/List'], function(ItemsView, HtmlElement, SelectionView, SegmentedView, List) {
    return ItemsView.inherit('js.ui.TabViewClass', {
        $classAttributes: ['tabItems', 'tabClassName', 'selectedIndex', 'selectedViews'],
        defaults: {
            selectedIndex: 0,
            selectedView: null,
            tabClassName: 'nav nav-tabs',
            tabItems: List
        },
        $defaultTemplateName: null,
        _initializeLayoutChildren: function (children) {
            var child;
            var self = this;
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                if (!this.$selectionView && child instanceof SelectionView) {
                    this.$selectionView = child;
                    this.$selectionView.set({items: this.$.tabItems});
                    this.$selectionView.bind('change:selectedItem', this._onTabChange, this);
                } else if (!this.$segmentedView && child instanceof SegmentedView) {
                    this.$segmentedView = child;
                }
            }
            this.callBase();
        },
        _renderChild: function (child) {
            if (child instanceof HtmlElement && child != this.$selectionView && child != this.$segmentedView) {
                this.$.tabItems.add(child);
                this.$segmentedView.addChild(child);
            } else {
                this.callBase();
            }
        },
        _onTabChange: function (e) {
            this.$segmentedView.set({visibleView: e.$});

        },
        _renderSelectedIndex: function (index) {
            this.$selectionView.set({selectedIndex: index});
        },
        _renderSelectedView: function (view) {
            this.$selectionView.set({selectedView: view});
        }

    })
});