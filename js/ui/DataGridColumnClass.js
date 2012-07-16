define(['js/core/Component'], function (Component) {

    var undefined;

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults : {
            name : 'column'
        },
        getFormatFnc: function(){
            return null;
        },
        createCellRenderer: function(attributes, parentScope){
            return this.$templates['cell'].createInstance(attributes, parentScope);
        },
        isDefined: function(value){
            return value !== null && value !== undefined;
        }
    });
});