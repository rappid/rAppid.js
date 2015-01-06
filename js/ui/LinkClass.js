define(["js/ui/View"], function (View) {

    var externalLink = /^(([^:]+:\/\/)|(javascript:))/i,
        stripHashSlash = /^#?\/?/,
        hashBankUrl = /^#?(.*)$/;

    return View.inherit('js.ui.LinkClass', {

        defaults: {

            tagName: 'a',

            /***
             * the href of the link element.
             * @type String
             */
            href: null,

            /***
             * the label of the Link rendered as text
             * @type String
             */
            label: '',

            /***
             * the target of the link element identifying how to open the link. If no target \
             * is specified but a protocol for the href (e.g. http://) if will use external by default.
             *
             * **Possible values**
             *
             *  + **intern** - opens the link intern without refreshing the page (e.g. #/myLink)
             *  + **external** - the link will open external
             *  + **_blank** - opens in a new window
             *
             * @type String
             */
            target: "intern",

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

            /***
             * the title of the link
             *
             * @type String
             */
            title: null
        },

        _renderIconClass: function (iconClass) {
            if (iconClass) {
                this._renderTemplateToPlaceHolder('iconTemplate', 'icon', {$iconClass: iconClass});
            } else {
                var placeHolder = this.getPlaceHolder("icon");
                if (placeHolder) {
                    placeHolder.clear();
                }
            }
        },

        _renderTarget: function (target) {
            if (target !== "intern" && target !== "external") {
                this._setAttribute("target", target);
            }
        },

        _renderHref: function (href) {
            if (this.$tagName == "a") {
                href = href || "javascript:void(0);";

                if (!(this.$.target === "external" || externalLink.test(href) || this.$.target === "_blank")) {

                    href = "#/" + href.replace(stripHashSlash, '');

                    if (!this.runsInBrowser()) {
                        // node rendering -> hash bang url
                        href = href.replace(hashBankUrl, "#!$1");
                    }
                }

                this.$el.setAttribute("href", href);
            }
        }
    });

});