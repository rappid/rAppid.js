define(["js/core/Bindable", "js/core/List"], function (Bindable, List) {

    return Bindable.inherit('js.ui.tree.TreeNode', {

        defaults: {
            data: null,
            expandable: true,
            isLeaf: false,
            expanded: false,
            parentNode: null,
            childNodes: List
        },

        /**
         * Sets expanded to true
         */
        expand: function () {
            this.set('expanded', true);
        },

        /**
         * Sets expanded to false
         */
        collapse: function () {
            this.set('expanded', false);
        },

        /***
         * Toggles the expanded state
         */
        toggle: function () {
            this.set('expanded', !this.$.expanded);
        },
        /***
         *
         * Adds a child to the tree and sets its parentNode to null
         *
         * @param {js.ui.tree.TreeNode} child
         * @param {Object} [options]
         */
        addChild: function(child, options){

            this.$.childNodes.add(child, options);

            child.set('parentNode', this);
        },

        /**
         * Returns childNode at position
         *
         * @param {Integer} pos
         * @returns {js.ui.tree.TreeNode}
         */
        getChildNodeAt: function(pos){
            return this.$.childNodes.at(pos);
        },

        /***
         *
         * Removes a child from the tree and set its parentNode to null
         *
         * @param {js.ui.TreeNode} child
         * @param {Object} [options]
         */
        removeChild: function(child, options){

            this.$.childNodes.remove(child, options);

            child.set('parentNode', null);
        },

        clear: function(){
            this.$.childNodes.reset([]);
        }

    });

});