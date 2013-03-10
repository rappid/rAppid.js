define(['js/ui/ItemsView'], function (ItemsView) {

    return ItemsView.inherit('js.ui.DataGridRow', {
        defaults: {
            tagName: "tr",
            itemKey: "column",
            item: "{$dataItem.data}"
        },
        _renderWidth: function(){
            // do nothing
        }
    });
});