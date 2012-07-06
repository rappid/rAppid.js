define(['js/core/Component'], function (Component) {

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults : {
            name : 'column'
        },
        createCellRenderer: function(attributes){
            return this.$templates['cell'].createInstance(attributes);
        }

    });
});