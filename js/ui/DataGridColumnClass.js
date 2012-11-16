define(['js/core/Component'], function (Component) {

    var undefined;

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults: {
            sortPath: null,
            sortable: true,
            sortDirection: 0,
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
        },
        isSorted: function(){
            return this.$.sortDirection !== 0;
        }.onChange('sortDirection'),
        sortDirectionStatus: function(){
            return this.$.sortDirection === 1 ? 'up' : 'down';
        }.onChange('sortDirection'),
        getSortPath: function(){
            return this.$.sortPath || this.$.path;
        }
    });
});