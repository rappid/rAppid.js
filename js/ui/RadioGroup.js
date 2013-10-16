define(['js/ui/View', 'xaml!js/ui/Radio'], function (View, Radio) {

    var radioId = 0;

    return View.inherit('js.ui.RadioGroup', {

        ctor: function () {
            this.callBase();

            if (!this.$.name) {
                this.set('name', 'radiogroup_' + (++radioId));
            }
        },

        defaults: {
            value: null,
            componentClass: "radio-group"
        },

        addChild: function (child) {

            if (!(child instanceof Radio)) {
                throw new Error("Children for RadioGroup must be from type Radio");
            }

            child.set("name", this.$.name);
            child.bind("change:checked", this._onRadioSelected, this);

            if (child.$.checked) {
                this.set("value", child.$.value);
            }

            this.callBase();
        },

        _commitValue: function (value) {
            var children = this.getViewChildren();
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (child.$.value === value) {
                    child.set("checked", true);
                }
            }
        },

        _onRadioSelected: function (e) {
            if (e.$ === true) {
                this.set("value", e.target.$.value);
            }
        }

    });
});