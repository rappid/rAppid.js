define(["js/core/Component", "js/html/HtmlElement"], function (Component, HtmlElement) {

    return Component.inherit('js.core.Component', {

        defaults: {
            duration: 3,
            containerClass: "notifications"
        },

        ctor: function () {
            this.$notifications = [];

            this.callBase();
        },

        showNotification: function (templateName, attributes, options) {
            if (!this.$container) {
                this.$container = this.createComponent(HtmlElement, {"class": this.$.containerClass, tagName: "div"});
                this.$stage.addChild(this.$container);
            }

            if (!this.$templates[templateName]) {
                console.warn("Couldn't find template " + templateName);
                return null;
            }

            var duration = options.duration || this.$.duration;

            var notification = this.$templates[templateName].createInstance(attributes);

            notification.bind('remove:dom', function () {
                notification.destroy();
            });

            this.$container.addChild(notification);

            var self = this;
            notification.close = function () {
                self.closeNotification(this);
            };
            this.$notifications.push(notification);

            setTimeout(function () {
                self.closeNotification(notification);
            }, duration * 1000);


            return notification;
        },

        closeNotification: function (notification) {
            this.$notifications.splice(this.$notifications.indexOf(notification), 1);
            this.$container.removeChild(notification);
        }


    });
});