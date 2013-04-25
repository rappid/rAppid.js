define(['js/core/EventDispatcher'], function(EventDispatcher) {

    /***
     * @summary A bus is an EventDispatcher used for application wide event based communication.
     *
     * @description The application wide message bus can be bound to event handler functions by annotation the
     * handler functions with the `.bus('My.Bus.Event')` annotation. The bus is automatically bound and
     * unbound for Components added to the stage.
     *
     * The automatically event handler registration can also be used for `Bindable`s after setting them up using the
     * `setUp` function of the bus.
     *
     */
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
            bindable._setUp();
        },

        tearDown: function(bindable) {
            if (!bindable.$stage) {
                // already teared down
                return;
            }

            bindable._tearDown();
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