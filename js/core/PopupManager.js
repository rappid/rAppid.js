define(['js/core/Component', 'underscore'], function (Component, _) {

    return Component.inherit('js.core.PopupManager', {

        /***
         *
         * @param url
         * @param options
         * @param replaceWindow
         * @returns {window}
         */
        showPopup: function(url, options, replaceWindow) {

            if (!this.runsInBrowser()) {
                throw new Error("Cannot open popups.");
            }

            options = options || {};

            var window = this.$stage.$window,
                features = [];

            options = _.defaults(options, {
                name: null,
                menubar: false,
                toolbar: false,
                location: false,
                personalbar: false,
                status: false,
                resizeable: true,
                scrollbars: true,
                dependend: false,
                dialog: false,
                minimizable: true,

                top: null,
                left: null,
                height: null,
                width: null
            });

            for (var key in options) {
                if (options.hasOwnProperty(key) && key !== "name") {
                    if (options[key] === true) {
                        features.push(key + "=yes")
                    } else if (options[key]) {
                        features.push(key + "=" + options[key]);
                    }
                }
            }

            return window.open(url, options.name, features.join(","), replaceWindow);

        },

        /***
         * shows a popup with a loading indicator, executes a task and
         * redirects the popup after the task has been executed
         *
         * @param {String} [preloaderUrl]
         * @param {Object} [options]
         * @param {Function} task - function(popUp, function (err, url) {})
         * @param {Function} [callback]
         */
        showPopupAsync: function(preloaderUrl, options, task, callback) {
            var popup = this.showPopup(preloaderUrl, options);
            this.$stage.$window.focus();

            if (task) {
                try {
                    task(popup, function (err, url) {
                        popup.focus();

                        if (err) {
                            popup.close();
                        } else if (url) {
                            popup.location = url;
                        }

                        callback && callback(err);
                    });
                } catch (e) {
                    callback && callback(e);
                }
            } else {
                callback && callback(new Error("No task specified"));
            }
        }

    });

});