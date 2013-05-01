define(["js/ui/View", "js/html/Input", "js/html/Select", "js/html/TextArea"], function (View, Input, Select, TextArea) {


    var fieldId = 0;

    return View.inherit("js.ui.FieldClass", {

        defaults: {
            label: "",
            inputId: null,
            enabled: true,
            error: null
        },

        $errorAttribute: 'value',
        ctor: function () {
            this.callBase();

            if (!this.$.inputId) {
                this.set('inputId', 'field_' + (++fieldId));
            }
        },
        _render$error: function (error, oldError) {
            if (error) {
                this.set('error', error);
                this.addClass('error');
            } else {
                this.set('error', null);
                this.removeClass('error');
            }
        },
        $defaultContentName: "controls",

        _renderContentChildren: function () {
            this.callBase();

            // find first Input, Select or TextArea and set id if null
            var children = this.getPlaceHolder('controls').$.content.getChildren();
            var firstChild;

            for (var j = 0; j < children.length; j++) {
                firstChild = this.getFirstChild(children[j]);
                if (firstChild) {
                    if (!firstChild.$.id) {
                        firstChild.set('id', this.$.inputId)
                    }
                    return;
                }
            }

        },

        getFirstChild: function (child) {
            if (child instanceof Input || child instanceof Select || child instanceof TextArea) {
                return child;
            }

            if (child && child.$children) {
                for (var i = 0; i < child.$children.length; i++) {
                    var c = this.getFirstChild(child.$children[i]);
                    if (c) {
                        return c;
                    }
                }
            }
        }
    });

});