define(["js/ui/View", "js/core/Content", "js/ui/Button", "underscore"], function (View, Content, Button, _) {

    var CLOSE_BEHAVIOR = {
        OTHER: "other",             // closes other menu buttons
        NON_PARENT: "nonParent",    // closes other menu buttons but not the parents
        NONE: "none"                // closes no other menu buttons
    };

    return View.inherit("js.ui.MenuButtonClass", {
        defaults: {
            /***
             * The label of the button.
             *
             * @type String
             */
            label: "",
            componentClass: 'btn-group menu-button',
            /**
             * The class name of the menu.
             *
             * @type String
             */
            menuClassName: "dropdown-menu",
            /**
             * Set's the menu visible.
             *
             * @type Boolean
             */
            menuVisible: false,
            /**
             * The class of the inner span in the link element
             *
             * @type String
             */
            labelClass: "",

            /**
             * The class of the inner link element
             *
             * @type String
             */
            buttonClass: "btn",

            /***
             * the class name for the icon
             * @type String
             */
            iconClass: null,

            /***
             * The inner label for the icon
             *
             * @type String
             */
            iconLabel: "",

            closeBehavior: CLOSE_BEHAVIOR.OTHER,

            tabIndex: null,

            title: null
        },
        $defaultContentName: 'menu',

        $instances: [],

        addChild: function (child) {
            this.callBase();
            if (child instanceof Button) {
                this._collectButton(child);
            }
        },

        _collectButton: function (child) {
            this.$button = child;
            this.$toggleButton = child;
        },

        _renderType: function (type) {
            this.$button.set({type: type});
        },

        _renderIconClass: function (iconClass) {
            this.$button.set({iconClass: iconClass});
        },

        _renderLabel: function (label) {
            if (this.$button) {
                this.$button.set({label: label});
            }

        },

        _renderMenuVisible: function (visible) {
            if (visible === true) {

                var closeBehavior = this.$.closeBehavior;
                if (closeBehavior !== CLOSE_BEHAVIOR.NONE) {
                    for (var i = 0; i < this.$instances.length; i++) {
                        var instance = this.$instances[i],
                            close = (instance !== this && instance.$.menuVisible === true);

                        if (close && closeBehavior === CLOSE_BEHAVIOR.NON_PARENT) {
                            // check that the instance is not a parent
                            var parent = this.$parent;
                            while (parent) {
                                if (parent === instance) {
                                    close = false;
                                    break;
                                }

                                parent = parent.$parent;
                            }
                        }

                        if (close) {
                            instance.set({menuVisible: false});
                        }
                    }
                }

                this.addClass('open');
            } else {
                this.removeClass('open');
            }

        },

        _bindDomEvents: function (el) {
            this.callBase();

            if (!_.contains(this.$instances, this)) {
                this.$instances.push(this);
            }
            var self = this;

            this.bindDomEvent('click', function () {
                self.set({menuVisible: false});
            });

            this.$toggleButton.bind('on:click', function (e) {
                if (self.$.enabled) {
                    e.stopPropagation();
                    e.preventDefault();
                    self.set({menuVisible: !self.$.menuVisible});
                }
            });

            this.$button.bind('on:click', function (e) {
                self.trigger('on:click', e, self);
            });

            this.dom(this.$stage.$document).bindDomEvent('click', function (e) {
                if (e.which === 1) {
                    self.set({menuVisible: false});
                }
            });

        },

        _preventDefault: function (e) {
            e.$.stopPropagation();
        },
        /***
         * Closes the menu
         */
        closeMenu: function () {
            this.set('menuVisible', false);
        },

        /**
         * Opens the menu
         */
        openMenu: function () {
            this.set('menuVisible', true);
        },

        /***
         * Toggles the menu
         */
        toggleMenu: function () {
            this.set('menuVisible', !this.$.menuVisible);
        }
    });

});