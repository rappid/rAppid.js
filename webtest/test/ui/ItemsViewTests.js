describe("#ItemsView", function () {

    describe("#simple", function () {
        it('should render items with templates', function () {
            $expect("#simple").to.exist().
                and.to.have.children("li").
                that.have.items(window.application.$.items.size());


            window.application.$.items.each(function(item, index){
                $expect($("#simple").find('li').eq(index)).to.have.attr('class', ""+item.id).and.to.have.text(item.value);
            });

        });


        var index = 1,
            value = "H",
            id = 4;

        it('should render item at specific index', function(){


            window.application.addItemAt({
                id: id,
                value: value
            },index);

            $expect("#simple").to.have.children("li").
                that.have.items(window.application.$.items.size());

            window.application.$.items.each(function (item, index) {
                $expect($("#simple").find('li').eq(index)).to.have.attr('class', "" + item.id).and.to.have.text(item.value);
            });
        });

        it('should remove item from DOM at specific index', function(){

            window.application.removeItemAt(index);

            $expect("#simple").to.have.children("li").
                that.have.items(2);

            $expect($("#simple").find('li').eq(index)).to.not.have.attr('class',""+id).and.to.not.have.text(value);
        });

        it('should remove all items from DOM on reset', function(){
            window.application.resetItems();

            $expect("#simple").to.be.empty();
        });

        it.skip('should rerender on sort', function(){
            // TODO: implement tests
        });

    });


    describe('#without template', function () {

        it('should use first component as template', function () {
            $expect("#woTemplate").to.exist().and.to.have.children('div').that.have.items(2);
        });

    });


});