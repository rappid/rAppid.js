define(['js/core/Component'], function (Component) {

    var undefined;

    return Component.inherit('js.ui.DataGridColumnClass', {
        defaults: {
            /**
             * The sort path
             * @type String
             */
            sortPath: null,

            /**
             * The path to the data to display
             * @type String
             */
            path: null,

            /**
             * Set's column to sortable
             *
             * @type Boolean
             */
            sortable: true,

            /**
             * Set's the default sort direction
             * @type Number
             *
             */
            sortDirection: 0,

            /**
             * The name of the column
             * @type String
             */
            name: "column",

            /**
             * The dataItem for the colum
             * @private
             * @type Object
             */

            $dataItem: null,

            /**
             * The path to the item
             * @type String
             */
            item: '$dataItem.data',

            /**
             * The title of the column
             * @type String
             */
            title: ""
        },
        getFormatFnc: function () {
            return null;
        },
        createCellRenderer: function (attributes) {
            return this.$templates.cell.createInstance(attributes);
        },
        createCellContainer: function (parentScope) {
            return this.$templates.cellContainer.createInstance(null, parentScope);
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