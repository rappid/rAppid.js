define(['js/ui/View'], function (View) {

    return View.inherit('js.core.Window', {

        defaults: {
            tagName: 'div',
            componentClass: 'window',
            closeOnBackdrop: false
        },

        events: [
            "on:backdropClick"
        ],

        ctor: function () {
            this.callBase();

            this.bind("on:backdropClick", this._onbackdropClick, this);
        },

        _onbackdropClick: function (e) {
            if (this.$.closeOnBackdrop) {
                this.close();
            }
        },

        /***
         * Shows the window by adding it to the WindowManager. You can pass a callback for closing of the window.
         *
         * The callback has the following signature.
         *
         * function(err, window, status){...}
         *
         * @param {Function} [callback]  - the callback which is called when the window gets closed.
         * @param {Boolean} [modal=false]
         *
         * @see js.core.WindowManager
         */
        show: function (callback, modal) {
            this.$stage.$windowManager.show(this, callback, modal);
        },
        /***
         * Calls the show method with modal=true and the callback
         *
         * @param {Function} [callback] - the callback which is called when the window gets closed
         */
        showModal: function (callback) {
            this.show(callback, true);
        },
        /**
         * Closes the window
         *
         * @param state
         */
        close: function (state) {
            this.trigger('close', state);
        },
        /**
         * Renders the window class attribute
         *
         * @param {String} cls
         * @param {String} oldCls
         * @private
         */
        _renderWindowClass: function (cls, oldCls) {
            if (oldCls) {
                this.removeClass(oldCls);
            }

            if (cls) {
                this.addClass(cls);
            }
        }


    });

});