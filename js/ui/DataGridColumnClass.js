define(['js/core/Component'], function (Component) {

    var undefined;

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults: {
            name: "column",
            title: ""
        },
        getFormatFnc: function () {
            return null;
        },
        createCellRenderer: function (attributes) {
            return this.$templates['cell'].createInstance(attributes);
        },
        createCellContainer: function () {
            return this.$templates['cellContainer'].createInstance(null);
        },
        isDefined: function (value) {
            return value !== null && value !== undefined;
        }
    });
});