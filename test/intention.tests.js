describe("Intention", function() {

  describe("Constructor:", function(){
    var intent = new Intention;
    it("Should return an object", function(){
      expect(intent).to.be.an('object')
    })
  });

  // create some elements to test with
  var container = $('<div>'),
    // this container does not have tn attrs
    nonResponsiveElm = $('<div id="getRidOfMe">'),
    responsiveElm1 = $('<div data-intent>');

  // basic tn attrs
  responsiveElm1
    .attr('in-mobile-class','mobile')
    .attr('in-tablet-class','tablet')
    .attr('in-touch-class','touch')
    .attr('in-standard-class','standard');
  
  container.append(nonResponsiveElm, responsiveElm1, $('<div intent>'));

  describe("add and remove: add and remove responsive elements", 
    function(){
      var intent = new Intention;

      it("Should add three items to intent.elms", function(){
        expect(intent.elms.length).to.equal(0);
        // intent.add returns the intent object so i should be able access the elms prop
        var divs = container.find('div');
        expect(intent.add(divs).elms.length).to.equal(3);
      });

      it("Should remove one item from intent.elms", function(){
        // find the element that should be removed
        var rmElm = container.find('#getRidOfMe');
        expect(intent.remove(rmElm).elms.length).to.equal(2);
      });
    });

  describe("elements: set the responsive elements from a dom scope", 
    function(){
      it("Should add all *reponsive* elms in the container div", function(){
          var intent = new Intention;
          expect(intent.elements(container).elms.length).to.equal(2);
        });

      it("Should query the dom for responsive elms, there are none.", 
        function(){
          var intent = new Intention;
          expect(intent.elements(document).elms.length).to.equal(0);
      });
    });

  describe("responsive: creating responsive functions", function(){

    var intent = new Intention,
      big={name:'big', val:400},
      small={name:'small', val:0},
      medium={name:'medium', val:200},
      sizeCtxs = [big, medium, small],
      size = intent.responsive({
          contexts: sizeCtxs,
          matcher: function(response, context){
            return response >= context.val;
          },
          ID:'size'});

    it("Should return an object", function(){
      expect(_.isObject(size)).to.equal(true);
    });

    // this is incorrect at < 400 screen sizes, fix
    it("Should set the the appropriate context", function(){
      var respond = size.respond;
      // in the small context
      respond(0);
      expect(intent.axes.size.current).to.equal('small');
      
      // in the medium context
      respond(200);
      expect(intent.axes.size.current).to.equal('medium');

      // in the big context
      respond(1000);
      expect(intent.axes.size.current).to.equal('big');

    });

    it('Should confirm the contexts through "is"', function(){
      var respond = size.respond;

      expect(respond(0).is('small')).to.equal(true);
      expect(respond(0).is('medium')).to.equal(false);
      expect(respond(0).is('big')).to.equal(false);
      
      // in the medium context
      expect(respond(200).is('medium')).to.equal(true);
      expect(respond(200).is('small')).to.equal(false);
      expect(respond(200).is('big')).to.equal(false);

      // in the big context
      expect(respond(1000).is('big')).to.equal(true);
      expect(respond(1000).is('medium')).to.equal(false);
      expect(respond(1000).is('small')).to.equal(false);

    });

    it("events should only fire when crossing a threshold", function(){
      var callbackCount = 0,
        respond = size.respond;;
      // set the current context to small
      respond(0);
      // attach a callback to big
      intent.on('big', function(){
        callbackCount++;
      });
      // change to the big context
      respond(1000);
      expect(callbackCount).to.equal(1);
      // resolve the responder to the big context again.
      respond(1000);
      // the event should not have fired
      expect(callbackCount).to.equal(1);
    });

    describe("recursive responsive axis creation", function(){
      it("should create three axis by calling intent.responsive once", 
        function(){
          var intent = new Intention;

          intent.responsive([
              {contexts:[{name:'foo'}]},
              {contexts:[{name:'bar'}]},
              {contexts:[{name:'baz'}]}
          ]);
          // TODO: make this que off the contexts length
          expect(intent.axes.__keys__.length).to.equal(3);
        });
    });
  });

  describe("is: test to see if a context name is in the .contexts property",
    function(){
      var intent = new Intention,
        respond=intent.responsive([{name:'foo'}, {name:'bar'}]).respond;

      it('should confirm the applied context is current and others are not', 
        function(){
          // change the axis into the foo context
          respond('foo');
          expect(intent.is('foo')).to.equal(true);
          expect(intent.is('bar')).to.equal(false);

        });

      it('should change contexts and confirm the new context is \
        in the contexts list', function(){
          respond('bar');
          expect(intent.is('bar')).to.equal(true);
          expect(intent.is('foo')).to.equal(false);
        });
    });

  describe("_fillSpec: takes a spec and fills in unspecified funcs", function(){
    var intent = new Intention;

    it('should take a spec and return a new one filled out', function(){

      var spec = {
          base:{
            append:'#default'
          },
          mobile: {
            'class': 'a',
            src: 'a.png',
            append: '#a'
          },
          tablet: {
            'class':'b',
            src: 'b.jpg'
          }
        },
        filled = {
          base:{
            append:'#default',
            'class':'',
            src:''
          },
          mobile: {
            'class': 'a',
            src: 'a.png',
            append: '#a'
          },
          tablet: {
            'class':'b',
            src: 'b.jpg',
            append:''
          }
          
        };
      expect(intent._fillSpec(spec)).to.eql(filled);
    });



    it('should take a spec with a axis and return filled out with unfunky ctx vals', function(){

      var spec = {
          _orientation:'foo',
          base:{
            append:'#default'
          },
          mobile: {
            'class': 'a',
            src: 'a.png',
            append: '#a'
          }
        },
        filled = {
          _orientation:'foo',
          base:{
            append:'#default',
            'class':'',
            src:''
          },
          mobile: {
            'class': 'a',
            src: 'a.png',
            append: '#a'
          }
        };
      expect(intent._fillSpec(spec)).to.eql(filled);
    });

  });
  

  describe("_contextualize: keeping track of the current contexts", function(){
    // takes a context object to add, the axis that context belongs 
    // (ofContexts) and the list of current contexts
    var intent = new Intention,
      axes = {
            id1:{
              current:'bar'
            },
            id2:{
              current:null
            },
            __keys__:['id1', 'id2']
          };
    
    it('should make a new axes object with the current context for id1 set to foo', 
      function(){
        var inCtx = 'foo',
          // TODO: change the order of these args
          newAxes = intent._contextualize('id1', inCtx, axes);
          expect(newAxes.id1.current).to.equal('foo');
      });
  });

  describe("_attrsToSpec: convert element's attrs to a responsive specification", 
    function(){
      it('should match when only one func is specified (class)', function(){
        var intent= new Intention,
          elm = $('<div>')
            .attr({'in-mobile-class':'foo',
              'in-tablet-class':'bar',
              'in-standard-class':'baz',
              'in-orientation':'qux'});

        expect(intent._attrsToSpec(elm[0].attributes)).to.eql({
          _orientation:'qux',
          mobile:{
            'class':'foo'
          },
          tablet:{
            'class':'bar'
          },
          standard:{
            'class':'baz'
          }
        });
      });

      it('should match when many funcs are specified', function(){
        var intent= new Intention,
          elm = $('<div>')
            .attr({'in-mobile-class':'foo',
              'in-tablet-class':'bar',
              'in-standard-class':'baz',
              'in-mobile-append':'#foo',
              'in-standard-href':'http://baz.baz'});

        expect(intent._fillSpec(intent._attrsToSpec(elm[0].attributes)))
          .to.eql({
            mobile:{
              'class':'foo',
              append:'#foo',
              href:''
            },
            tablet:{
              'class':'bar',
              append:'',
              href:''
            },
            standard:{
              'class':'baz',
              href:'http://baz.baz',
              append:''
            }
          });
      });
    });
  
  describe('_resolveSpecs: from a list of names make object of changes', 
    function(){

      it('should combine the classes and cascade to specified attr', function(){
        var intent = new Intention;
        expect(
          intent._resolveSpecs(['foo', 'bar'], {
            foo: {
              'class':'foo',
              href:''
            },
            bar:{
              'class':'bar',
              href:'http://bar.bar'
            }
          }))
          .to.eql({
            'class':['foo', 'bar'],
            href:'http://bar.bar'
          });
      });
      
      it('should understand axis specs', function(){
        var intent= new Intention,
          elm = $('<div>')
            .attr({'in-mobile-class':'foo',
              'in-tablet-class':'bar',
              'in-standard-class':'baz',
              'in-orientation':'qux'});
        
        intent.add(elm);
        
        var orientation = intent.responsive({ID:'orientation', contexts:[{name:'portrait'},{name:'landscape'}]});

        orientation.respond('portrait');
        
        expect(elm.hasClass('portrait')).to.equal(true);
        expect(elm.hasClass('qux')).to.equal(true);

        // switch
        orientation.respond('landscape');
        
        expect(elm.hasClass('landscape')).to.equal(true);
        expect(elm.hasClass('qux')).to.equal(true);

        expect(elm.hasClass('portrait')).to.equal(false);

      });
      
    });

  describe('_contextConfig: compiles a list of contexts to be applied and \
    those that are not applied', 
    function(){
      it('should add the foo spec to in contexts and bar to out contexts', function(){
        var intent = new Intention,
          axes = {
            id1:{
              current:'foo'
            },
            id2:{
              current:null
            },
            __keys__:['id1', 'id2']
          },
          changes = intent._contextConfig({
            foo:{
              'class':'foo',
              append:'#foo'
            },
            bar: {
              'class':'bar',
              append:'#bar'
            }
          }, axes);

        expect(changes.inSpecs)
          .to.eql({
            'class':['foo'],
            move:{value:'#foo', placement:'append'}
          });

        expect(changes.outSpecs)
          .to.eql({
            'class':['bar'],
            move:{value:'#bar', placement:'append'}
          });
      });
    });

  describe('_makeChanges: maniputate an element based on responsive specification', 
    function(){

        var intent = new Intention,
          elm=$('<div class="baz">'),
          axes = {
            id1:{
              current:'foo'
            },
            id2:{
              current:null
            },
            __keys__:['id1', 'id2']
          },
          changes = {
            foo:{
              'class':'foo',
              href:'http://foo.foo'
            },
            bar: {
              'class':'bar',
              append:'#bar'
            }
          };

        intent._makeChanges(elm, changes, axes);

        it('should have classes of appropriate context', function(){
          expect(elm.hasClass('foo')).to.equal(true);
          expect(elm.hasClass('bar')).to.equal(false);
        });

        it('should have attr of current context', function(){
          expect(elm.attr('href')).to.equal('http://foo.foo')
        })

        it('should not have deleted a class that is not specified in the out contexts', 
          function(){
            expect(elm.hasClass('baz')).to.equal(true);
          });
    });

  describe('jquery event', function(){
    it('should fire a jquery trigger event on every elm', function(){
      var intent = new Intention,
        fire=false;

      intent.add($('<div>').on('intent', function(){
        fire=true
      }));

      intent.responsive([{name:'base'}]).respond('base');

      expect(fire).to.equal(true);
    })
  })
  
  describe("regex tests", function(){
    
    describe('full attr match', function(){
      // TODO update intention regex
      var attrPattern = new RegExp(
        '^(data-)?(in|intent)-([a-zA-Z0-9][_a-zA-Z0-9]*)-([A-Za-z:-]+)');

      it('should match on an abbreviated nonstandard prefix', function(){
          expect(
            attrPattern
              .test('in-mobile-class')).to.equal(true);

      });

      it('should match on an abbreviated standard prefix', function(){
          expect(
            attrPattern
              .test('data-in-mobile-class')).to.equal(true);
      });

      it('should not match when context starts with an underscore', function(){
          expect(
            attrPattern
              .test('data-in-_mobile-class')).to.equal(false);
      });

      it('should match on a nonstandard prefix', function(){
          expect(
            attrPattern
              .test('intent-mobile-class')).to.equal(true);

      });

      it('should match on an standard prefix', function(){
          expect(
            attrPattern
              .test('data-intent-mobile-class')).to.equal(true);

      });

      it('should match without a prefix', function(){
          expect(
            attrPattern
              .test('mobile-class')).to.equal(false);
      });
      
      it('should match a data attr', function(){
          expect(
            attrPattern
              .test('in-standard-data-toggle')).to.equal(true);
      });
    });

    describe('context and axis only match', function(){
      var ctxOnlyPattern = new RegExp(
        '^(data-)?(in|intent)-([a-zA-Z0-9][_a-zA-Z0-9]*)$');

      it('should match on the prefix and context', function(){
        expect(ctxOnlyPattern
          .test('in-standard')).to.equal(true);
      });

      
      it('should not match on just the prefix', function(){
        expect(ctxOnlyPattern
          .test('in')).to.equal(false);
      });
      
      it('should not match on the prefix plus a hiphen', function(){
        expect(ctxOnlyPattern
          .test('in-')).to.equal(false);
      });

      it('should not match when a func is specified', function(){
        expect(ctxOnlyPattern
          .test('in-standard-class')).to.equal(false);
      });

      it('should not match when ending with a hyphen', function(){
        expect(ctxOnlyPattern
          .test('in-standard-')).to.equal(false);
      });

      it('should not match when the prefix is invalid', function(){
        expect(ctxOnlyPattern
          .test('tin-standard')).to.equal(false);
      });

    });




  });

  describe('underscore test', function(){
    
    it('should be the relative complement', function(){
      expect(_.difference([1,2,3], [3,4,5])).to.eql([1,2]);
      expect(_.difference([1,2,3], [3,2])).to.eql([1]);
    });
  });

});