define(['js/core/Component'], function (Component) {

    var undefined;

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults: {
            sortable: false,
            name: "column",
            title: ""
        },
        getFormatFnc: function () {
            return null;
        },
        createCellRenderer: function (attributes, parentScope) {
            return this.$templates['cell'].createInstance(attributes, parentScope);
        },
        createCellContainer: function (parentScope) {
            return this.$templates['cellContainer'].createInstance(null, parentScope);
        },
        isDefined: function (value) {
            return value !== null && value !== undefined;
        }
    });
});