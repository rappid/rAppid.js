define(['js/core/Bindable'], function(Bindable) {

    return Bindable.inherit('js.core.HeadManager', {
        ctor: function(document) {
            this.$head = document.head || document.getElementsByTagName('head')[0];
            this.$document = document;
            this.$metaTags = [];

            this.callBase(null);


            this.bind('change', this._render, this);
        },
        _render: function(){
            if(!this.$title){
                var elements  = this.$head.getElementsByTagName('title');
                if(!elements.length){
                    this.$title = this.$document.createElement('title');
                    this.$head.appendChild(this.$title);
                }else{
                    this.$title = elements[0];
                }
            }

            // remove all meta tags
            for(var i = 0; i < this.$metaTags.length; i++){
                this.$head.removeChild(this.$metaTags[i]);
            }
            this.$metaTags = [];
            var attributes = this.$, val, metaEl;
            for(var key in attributes){
                if(attributes.hasOwnProperty(key)){
                    val = attributes[key];
                    if(key == 'title'){
                        this.$title.text = val;
                    }else{
                        metaEl = this.$document.createElement('meta');
                        metaEl.setAttribute('name',key);
                        metaEl.setAttribute('content',val);
                        this.$head.appendChild(metaEl);
                        this.$metaTags.push(metaEl);
                    }

                }
            }

        }
    });

});