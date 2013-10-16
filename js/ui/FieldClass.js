define(["js/ui/View", "js/html/Input", "js/html/Select", "js/html/TextArea", 'js/core/ErrorProvider'], function (View, Input, Select, TextArea, ErrorProvider) {


    var fieldId = 0;

    return View.inherit("js.ui.FieldClass", {

        defaults: {
            label: "",
            inputId: null,
            enabled: true,
            error: null,
            required: false,
            requiredClass: "required"
        },

        inject: {
            errorProvider: ErrorProvider
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
            var children = this.findContent('controls').$children;
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

        _renderRequired: function (required) {
            if (required) {
                this.addClass(this.$.requiredClass);
            } else {
                this.removeClass(this.$.requiredClass);
            }
        },

        getFirstChild: function (child) {
            if (child instanceof Input || child instanceof Select || child instanceof TextArea) {
                return child;
            }

            if (child && child.$children) {
                var children = child.getViewChildren();
                for (var i = 0; i < children.length; i++) {
                    var c = this.getFirstChild(children[i]);
                    if (c) {
                        return c;
                    }
                }
            }

            return null;
        }
    });

});