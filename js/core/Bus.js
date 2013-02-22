define(['js/core/EventDispatcher'], function(EventDispatcher) {
    // no extra functionality needed, but we need a separate factory for injection

    var Bus = EventDispatcher.inherit('js.core.Bus', {

        ctor: function(stage) {
            this.callBase();

            this.$stage = stage;

            this.bind(Bus.Event.SET_UP, this._setUpBindable, this);
            this.bind(Bus.Event.TEAR_DOWN, this._tearDownBindable, this);
        },

        setUp: function (bindable) {
            if (bindable.$stage) {
                // already set up
                return;
            }

            bindable.$stage = this.$stage;
            bindable._inject();
        },

        tearDown: function(bindable) {
            if (!bindable.$stage) {
                // already teared down
                return;
            }

            bindable._extract();
            bindable.$stage = null;
        },

        _setUpBindable: function(e) {
            this.setUp(e.$);
        },

        _tearDownBindable: function(e) {
            this.tearDown(e.$);
        }

    });

    Bus.Event = {
        SET_UP: "Bindable.SetUp",
        TEAR_DOWN: "Bindable.TearDown"
    };

    return Bus;
});