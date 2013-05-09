define(["js/core/Component"], function (Component) {

    return Component.inherit('js.core.Head', {
        ctor: function () {
            this.callBase();
            this.$headManager = this.$stage.$headManager;
            this.bind('change', this.render, this);
        },

        defaults: {
            /***
             * @type String
             */
            title: null,

            /***
             * @type String
             */
            head: null,

            /***
             * @type String
             */
            author: null
        },

        render: function () {
            this.$headManager.set(this.$);
        }
    });

});