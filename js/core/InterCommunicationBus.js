define(['js/core/Base', 'underscore'], function(Base, _) {
    return Base.inherit('js.core.InterCommunicationBus', {

        ctor: function() {
            this.$busses = [];
        },

        trigger: function(eventType, event) {

            for (var i = 0; i < this.$busses.length; i++) {
                try {
                    this.$busses[i].trigger(eventType, event);
                } catch (e) {
                    this.log(e, "error");
                }
            }
        },

        registerBus: function(bus) {
            this.$busses.push(bus);
        },

        unregisterBus: function(bus) {
            var i = _.indexOf(this.$busses, bus);
            if (i !== -1) {
                this.$busses.splice(i, 1);
            }
        }
    });
});