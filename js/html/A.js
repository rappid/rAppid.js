define(['js/html/HtmlElement'], function (HtmlElement) {

    var externalLink = /^(([^:]+:\/\/)|(javascript:))/i,
        stripHashSlash = /^#?\/?/,
        hashBankUrl = /^#?(.*)$/;

    return HtmlElement.inherit("js.html.A", {

        defaults: {
            tagName: 'a',
            target: null,
            href: null
        },

        _initializationComplete: function () {
            this.callBase();

            var history = this.$stage.$history;

            if (history.$.useState) {
                this.bind("on:click", function (e) {
                    e.preventDefault();
                    history.navigate(this.plainHref());
                }, this);
            }

        },

        plainHref: function () {
            var href = this.$.href || "";
            return href.replace(stripHashSlash, '');
        },

        _renderHref: function (href) {
            href = href || "javascript:void(0);";

            if (!(this.$.target === "external" || externalLink.test(href) || this.$.target === "_blank")) {

                var plainHref = this.plainHref();
                href = "#/" + plainHref;

                if (!this.runsInBrowser()) {
                    // node rendering -> hash bang url
                    href = href.replace(hashBankUrl, "#!$1");
                } else if (this.$stage.$history.$.useState) {
                    // we use push state methods -> show plain href
                    // but register a click handler which will perform a push state
                    href = plainHref;
                }
            }

            this.$el.setAttribute("href", href);
        },

        _renderTarget: function (target) {
            if (target && target !== "external") {
                this.$el.setAttribute("target", target);
            }
        }
    });
});