define(['js/ui/VirtualItemsView'], function(VirtualItemsView) {

    return VirtualItemsView.inherit('js.ui.TileListClass', {

        defaults: {
            heightUpdatePolicy: 'in',
            widthUpdatePolicy: 'in'
        },

        _createRenderer: function() {
            var ret = this.callBase();
            ret.set({
                position: 'absolute'
            });
            return ret;
        }
    });

});