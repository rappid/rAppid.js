define(['js/ui/View'], function(View) {

    return View.inherit('js.core.Window', {

        defaults: {
            tagName: 'div',
            componentClass: 'window'
        },

        /***
         * shows the window by adding it to the WindowManager
         * @param {Function} [callback]
         * @param {Boolean} [modal=false]
         *
         * @see js.core.WindowManager
         */
        show: function(callback, modal) {
            this.$stage.$windowManager.show(this, callback, modal);
        },

        showModal: function(callback) {
            this.show(callback, true);
        },

        close: function(state) {
            this.trigger('close', state);
        }

    });

});