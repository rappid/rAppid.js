define(["js/ui/View", "js/core/List"], function (View, List) {

    var KEY_UP = 38,
        KEY_DOWN = 40,
        KEY_LEFT = 37,
        KEY_RIGHT = 39,
        KEY_ENTER = 13,
        KEY_DELETE = 46,
        KEY_BACKSPACE = 8;

    return View.inherit("js.ui.AutoCompleteBoxClass", {

        defaults: {
            componentClass: "auto-suggestion-box",

            search: null,

            type: "text",

            suggestions: List,

            invalidationTime: 250,

            placeholder: null,

            selectedSuggestion: null,

            inputClass: null,

            maxItems: 5,

            _showAutoSuggestion: false,

            /***
             * @codeBehind
             */
            input: null
        },

        events: ["on:suggestionClick"],

        _commitSearch: function (search) {
            if (!search) {
                this.clearSuggestions();
                return;
            }
            if (!this.$.selectedSuggestion) {
                var self = this,
                    maxItems = this.$.maxItems;



                this._debounceFunctionCall(function (search) {

                    this._search(search, function (err, data) {
                        if (!err && data && search === self.$.search) {
                            // results for the search term

                            self.$.suggestions.reset(data.slice(0, maxItems));
                        }
                    });

                }, "search", this.$.invalidationTime, this, [search], "wait");
            }

        },

        blur: function () {
            this.$.input.blur();
        },

        focus: function () {
            this.$.input.focus();
        },

        /***
         *
         * @param search
         * @param callback - function(err, resultsAsArray)
         * @private
         * @abstract
         */
        _search: function (search, callback) {
            callback && callback(true);
        },

        _handleKeyDown: function (e) {
            var domEvent = e.domEvent;
            switch (domEvent.keyCode) {
                case KEY_BACKSPACE:
                case KEY_DELETE:
                    this.set('originalSearch', this.$.search);
                    break;
                case KEY_UP:
                    e.preventDefault();
                    return;
                case KEY_ENTER:
                    this.clearSuggestions();
                    return;
                case KEY_LEFT:
                case KEY_RIGHT:
                case KEY_DOWN:
                    return;
                    return;
            }

            this.set('selectedSuggestion', null);
        },

        clearSuggestions: function () {
            this.set('originalSearch', this.$.search);
            this.$.suggestions.clear();
            this.set('selectedSuggestion', null);
        },

        _handleKeyUp: function (e) {
            var domEvent = e.domEvent;

            switch (domEvent.keyCode) {
                // UP
                case KEY_UP:
                    this.selectPrevious();
                    break;
                // DOWN
                case KEY_DOWN:
                    this.selectNext();
                    break;

            }

        },

        _handleSuggestionClick: function (e) {
            if (this.$.selectedSuggestion) {
                this.trigger('on:suggestionClick', e, this);

            }
        },

        _commitSelectedSuggestion: function (suggestion, old) {
            if (suggestion && !old) {
                this.set('originalSearch', this.$.search, {silent: true});
            }
            if (suggestion) {
                this.set('search', this._getTextForSuggestion(suggestion));
            } else if (old) {
                this.set('search', this.$.originalSearch);
            }
            if (this.isRendered()) {
                this.$.input.focus();
            }
        },

        _getTextForSuggestion: function (suggestion) {
            return suggestion;
        },

        _toggleSuggestionBox: function (visible) {
            if (visible) {
                this.set('_showAutoSuggestion', visible);
            } else {
                var self = this;
                setTimeout(function () {
                    self.set('_showAutoSuggestion', visible);
                }, 300);
            }
        },

        selectNext: function () {
            var suggestion = null;
            if (this.$.selectedSuggestion) {
                var i = this.$.suggestions.indexOf(this.$.selectedSuggestion) + 1;
                if (i < this.$.suggestions.size()) {
                    suggestion = this.$.suggestions.at(i);
                }
            } else {
                suggestion = this.$.suggestions.at(0);
            }
            this.set('selectedSuggestion', suggestion);
        },

        getHtmlForItem: function (term) {
            var ret = "";
            var originalSearch = this.$.search;
            if (originalSearch) {
                var l = originalSearch.toLowerCase().trim(),
                    t = term.toLowerCase(),
                    i = t.indexOf(l);
                if (i > -1) {
                    ret += term.substring(0, i);
                    ret += '<strong>' + term.substr(i, l.length) + '</strong>';
                    ret += term.substr(i + l.length);
                } else {
                    ret = t;
                }
            }
            return ret;
        },

        getOtherPart: function () {

        },

        selectPrevious: function () {
            var suggestion = null;
            if (this.$.selectedSuggestion) {
                var i = this.$.suggestions.indexOf(this.$.selectedSuggestion) - 1;
                if (i >= 0) {
                    suggestion = this.$.suggestions.at(i);
                }
            } else {
                suggestion = this.$.suggestions.at(this.$.suggestions.size() - 1);
            }
            this.set('selectedSuggestion', suggestion);
        },
        _emptyClass: function () {
            return !this.$.suggestions || !this.$.suggestions.size() ? "empty" : "";
        }.onChange('suggestions.size()'),

        _openStateClass: function () {
            return this.$._showAutoSuggestion ? "open" : "";
        }.onChange("_showAutoSuggestion")

    });
});