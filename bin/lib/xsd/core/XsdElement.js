define(["js/core/DomElement"], function (DomElement) {

    return DomElement.inherit("xsd.XsdElement", {

        ctor: function () {
            this.callBase();

            // clear class attributes
            this.$classAttributes = [
                "cid",
                /\$/
            ];
            this.$namespace = "http://www.w3.org/2001/XMLSchema";
        }

    });

});