define(["js/core/List"], function (List) {

    return List.inherit('js.ui.tree.TreeNode', {

        defaults: {
            data: null,
            expandable: true,
            isLeaf: false,
            expanded: false
        },

        expand: function () {
            this.set('expanded', true);
        },

        collapse: function () {
            this.set('expanded', false);
        },

        toggle: function () {
            this.set('expanded', !this.$.expanded);
        }

    });

});