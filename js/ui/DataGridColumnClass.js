define(['js/core/Component'], function (Component) {

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults : {
            name : 'column'
        },
        createCellRenderer: function(attributes, parentScope){
            return this.$templates['cell'].createInstance(attributes, parentScope);
        }

    });
});