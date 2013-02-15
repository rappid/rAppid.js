describe("#SelectTests", function () {

    describe("#simple items", function(){
        it('should just render plain options when no items are set', function(){
            $expect("#simple").to.exist().
                and.to.have.children("option").
                that.have.items(3);

        })
    });

    describe("#bound items", function () {

        it("should render all items with the given template", function () {

            $expect("#bound").to.exist().
                and.to.have.children("option").
                that.have.items(2);

            $expect($("#bound").find("option").eq(0)).to.have.value("1");
            $expect($("#bound").find("option").eq(0)).to.have.text("A");
            $expect($("#bound").find("option").eq(1)).to.have.value("2");
            $expect($("#bound").find("option").eq(1)).to.have.text("B");
        });

        it.skip("should skip", function() {
            throw new SkipError();
        })
    });
});