define(["js/ui/View", "js/core/List"], function(View, List) {

    return View.inherit("js.ui.AutoCompleteBoxClass", {

        defaults: {
            componentClass: "auto-complete-box",

            search: null,

            type: "text",

            proposals: List,

            invalidationTime: 250,

            placeholder: null,

            inputClass: null,

            maxItems: 10,

            /***
             * @codeBehind
             */
            input: null
        },

        _commitSearch: function(search) {

            var self = this,
                maxItems = this.$.maxItems;

            if (!search) {
                this.$.proposals.reset();
                return;
            }


            this._debounceFunctionCall(function(search) {

                this._search(search, function(err, data) {
                    if (!err && data && search === self.$.search) {
                        // results for the search term

                        self.$.proposals.reset(data.slice(0, maxItems));
                    }
                });

            }, "search", this.$.invalidationTime, this, [search], "wait");

        },

        /***
         *
         * @param search
         * @param callback - function(err, resultsAsArray)
         * @private
         * @abstract
         */
        _search: function(search, callback) {
            callback && callback(true);
        }

    });
});