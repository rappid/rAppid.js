define(["js/core/Component", "js/html/HtmlElement"], function (Component, HtmlElement) {

    var Tooltip = HtmlElement.inherit("js.core.TooltipManager.Tooltip", {
        defaults: {
            tagName: "div",
            position: "absolute",
            manager: null
        },

        $classAttributes: ["manager"],

        hide: function () {
            this.$.manager && this.$.manager.hideTooltip(this);
        }
    });

    return Component.inherit({
        defaults: {
            /**
             * The css class of the TooltipManager container
             */
            containerClass: "tooltips",
            /**
             * The animation class which should be added for show and hide
             */
            animationClass: null,
            /**
             * default duration for auto-hide in ms
             */
            duration: false
        },

        ctor: function () {
            this.$tooltips = [];

            this.callBase();
        },
        /**
         * Shows a tooltip with the given template add the target element
         *
         * @param {String} templateName - The name of the template to use
         * @param {js.core.Component} target - The target element
         * @param {Object} attributes - the
         * @param {Object} options  - Options for displaying the
         * @param {Number} options.duration - default is false. Duration for auto-hide of tooltip
         * @param {String} options.animationClass - default is set by TooltipManager.
         * @returns {js.core.TooltipManager.Tooltip}
         */
        showTooltip: function (templateName, target, attributes, options) {
            if (!this.$container) {
                this.$container = this.createComponent(HtmlElement, {"class": this.$.containerClass, "tagName": "div"});
                this.$stage.addChild(this.$container);
            }
            var tooltip = this.getTooltipByNameAndTarget(templateName, target);
            if (tooltip) {
                return tooltip;
            } else {
                options = options || {};

                if (target && target.isRendered()) {
                    var content = options.content,
                        animationClass = this.$.animationClass || options.animationClass,
                        duration = this.$.duration || options.duration;

                    var rect = target.$el.getBoundingClientRect();

                    // create a instance
                    tooltip = this.createComponent(Tooltip,
                        {
                            manager: this,
                            "class": templateName,
                            animationClass: animationClass,
                            left: rect.left,
                            top: rect.top,
                            width: rect.width,
                            height: 0 // due to missing pointer event support in IE
                        }
                    );

                    var templateInstance = this.$templates[templateName].createInstance(attributes || {});

                    templateInstance.$classAttributes = templateInstance.$classAttributes || [];
                    // add class attributes
                    for (var key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            templateInstance.$classAttributes.push(key);
                        }
                    }
                    // add template instance
                    tooltip.addChild(templateInstance);
                    tooltip.bind('dom:remove', function () {
                        tooltip.destroy();
                    });
                    // if content
                    if (content) {
                        templateInstance.$children = content.getChildren();
                        templateInstance._renderChildren(templateInstance.$children);
                    }

                    this.$tooltips.push({
                        target: target,
                        templateName: templateName,
                        instance: tooltip
                    });

                    this.$container.addChild(tooltip);

                    var self = this;
                    if (duration && duration > 0) {
                        setTimeout(function () {
                            self.hideTooltip(tooltip);
                        }, duration)
                    }

                    return tooltip;
                } else {
                    throw new Error("No target for tooltip specified");
                }
            }


        },

        /**
         * Closes a tooltip by name and target element or tooltip Instance
         *
         * @param {js.core.TooltipManager.Tooltip|String} tooltip - The tooltip instance or the templateName
         * @param {js.core.Component} [target] - The target element of the tooltip
         *
         */
        hideTooltip: function (tooltip, target) {
            if (!(tooltip instanceof Tooltip)) {
                tooltip = this.getTooltipByNameAndTarget(tooltip, target);
            }
            if (tooltip) {
                var i = this.$tooltips.indexOf(tooltip);
                this.$tooltips.splice(i, 1);
                this.$container.removeChild(tooltip);
            }
        },

        /**
         * Returns a tooltip instance by name and target element
         *
         * @param {String} templateName
         * @param {js.core.Component} target
         * @returns {js.core.TooltipManager.Tooltip}
         */
        getTooltipByNameAndTarget: function (templateName, target) {
            var tooltip;
            for (var i = 0; i < this.$tooltips.length; i++) {
                tooltip = this.$tooltips[i];
                if (tooltip.templateName === templateName && tooltip.target === target) {
                    return tooltip.instance;
                }
            }
            return null;
        }
    })
});