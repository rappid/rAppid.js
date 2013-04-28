define(["js/ui/View"], function(View) {

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
            target: "intern"
        },

        _renderIconClass: function (iconClass) {
            if (iconClass) {
                this._renderTemplateToPlaceHolder('iconTemplate', 'icon', {$iconClass: iconClass});
            } else {
                this.getPlaceHolder("icon").clear();
            }
        },

        _renderLabel: function (label) {
            if (!this.$.title) {
                this._renderTitle(label);
            }
        },

        _renderTitle: function (title) {
            if (title) {
                this.$el.setAttribute("title", title);
            } else {
                this.$el.removeAttribute("title");
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