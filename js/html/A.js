define(['js/html/HtmlElement'], function (HtmlElement) {

    var externalLink = /^(([^:]+:\/\/)|(javascript:)|(\/\/))/i,
        stripHashSlash = /^#?\/?/,
        hashBankUrl = /^#?(.*)$/;

    return HtmlElement.inherit("js.html.A", {

        defaults: {
            tagName: 'a',
            target: null,
            href: null,

            createHistoryEntry: true,
            triggerRoute: true
        },

        $classAttributes: ["createHistoryEntry", "triggerRoute"],

        _initializationComplete: function () {
            this.callBase();

            var history = this.$stage.$history;

            if (history.$.useState) {
                this.bind("on:click", function (e) {
                    if (e.isDefaultPrevented) {
                        return;
                    }
                    e.preventDefault();

                    if (this.$.href) {
                        history.navigate(this.plainHref(), this.$.createHistoryEntry, this.$.triggerRoute);
                    }

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


                if (!this.runsInBrowser()) {
                    // node rendering -> hash bang url
                    href = href.replace(hashBankUrl, "#!$1");
                } else if (!this.$stage.$history.$.useState) {

                    var plainHref = this.plainHref();
                    href = "#/" + plainHref;

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