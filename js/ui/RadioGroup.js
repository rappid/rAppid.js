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

            child.set("name", this.$.name);
            child.bind("change:checked", this._onRadioSelected, this);

            this.callBase();

            if (child.$.checked) {
                this.set("value", child.$.value);
            } else if (child.$.value === this.$.value) {
                child.set("checked", true);
            }


        },

        _commitValue: function (value) {
            var children = this.getViewChildren(),
                found = false,
                child, i;
            for (i = 0; i < children.length; i++) {
                child = children[i];
                if(value == null){
                    child.set("checked", false);
                    found = true;
                } else if(child.$.value === value) {
                    child.set("checked", true);
                    found = true;
                }
            }

            if (!found) {
                for (i = 0; i < children.length; i++) {
                    child = children[i];
                    child.set("checked", false);
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