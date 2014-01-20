define(["js/core/Component", "js/html/HtmlElement"], function (Component, HtmlElement) {

    return Component.inherit('js.core.NotificationManager', {

        defaults: {
            /**
             * The duration in seconds
             *
             * @type Number
             */
            duration: 3,
            /**
             * The css class for the container, which contains the notifications
             *
             * @type String
             */
            containerClass: "notifications"
        },

        ctor: function () {
            this.$notifications = [];

            this.callBase();
        },
        /**
         * Shows a notification with the given template.
         * The templates need to be defined in the NotificationManager instance via XAML.
         *
         * @param {String} templateName - the name of the Template for the Notification
         * @param {Object} [attributes] - attributes for the template
         * @param {Object} [options] - options for
         * @returns {js.core.DomElement} - the created notification instance
         */
        showNotification: function (templateName, attributes, options) {
            if (!this.$container) {
                this.$container = this.createComponent(HtmlElement, {"class": this.$.containerClass, tagName: "div"});
                this.$stage.addChild(this.$container);
            }

            if (!this.$templates[templateName]) {
                console.warn("Couldn't find template " + templateName);
                return null;
            }

            options = options || {};

            var duration = options.hasOwnProperty("duration") ? options.duration : this.$.duration;

            var notification = this.$templates[templateName].createInstance(attributes || {});

            notification.bind('remove:dom', function () {
                notification.destroy();
            });

            this.$container.addChild(notification);

            var self = this;
            notification.close = function () {
                self.closeNotification(this);
            };
            this.$notifications.push(notification);

            if (duration) {
                setTimeout(function () {
                    self.closeNotification(notification);
                }, duration * 1000);
            }

            return notification;
        },
        /**
         * Closes a notification instance.
         *
         * @param {js.core.DomElement} notification - the instance returned by showNotification
         */
        closeNotification: function (notification) {
            this.$notifications.splice(this.$notifications.indexOf(notification), 1);
            this.$container.removeChild(notification);
        }


    });
});