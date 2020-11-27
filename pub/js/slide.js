"use strict";

function extend( a, b ) {

    for( var i in b ) {
        a[ i ] = b[ i ];
    }

    return a;

}

function wrapArray(val) {
    return Array.isArray(val) ? val : [val];
}

/**
 * Creates an HTML element and returns a reference to it.
 * If the element already exists the existing instance will
 * be returned.
 */
function createSingletonNode( container, tagname, classname, innerHTML ) {

    // Find all nodes matching the description
    var nodes = container.querySelectorAll( '.' + classname );

    // Check all matches to find one which is a direct child of
    // the specified container
    for( var i = 0; i < nodes.length; i++ ) {
        var testNode = nodes[i];
        if( testNode.parentNode === container ) {
            return testNode;
        }
    }

    // If no node was found, create it now
    var node = document.createElement( tagname );
    node.className = classname;
    //console.log(tagname);
    //console.log(innerHTML);
    if( typeof innerHTML === 'string' ) {
        
        node.innerHTML = innerHTML;
    }
    container.appendChild( node );

    return node;

}


function SliderGenerator(){

    // Current slide-index
    this._hslideIndex=0;

    this._slides=[];

    // Event-listener
    this._boundEventListener = {
        'slide': [],
        'beforeSlide': [],
        'fragment': [],
        'beforeFragment': [],
        'action': []
    };

    this.config={
        // Display presentation control arrows
			controls: true,

			// Help the user learn the controls by providing hints, for example by
			// bouncing the down arrow when they first encounter a vertical slide
			controlsTutorial: true,

			// Determines where controls appear, "edges" or "bottom-right"
			controlsLayout: 'bottom-right',

			// Visibility rule for backwards navigation arrows; "faded", "hidden"
			// or "visible"
            controlsBackArrows: 'faded',
            
            // Enable keyboard shortcuts for navigation
            keyboard: true,
            
            // Display a presentation progress bar
			progress: true,


    }

    this._options = {

        // Query selectors
        HORIZONTAL_SLIDES_SELECTOR: '.slides > section',
        VERTICAL_SLIDES_SELECTOR: 'section',
        FRAGMENTS_SELECTOR: '.frag',

        // CSS Group prefix
        fragmentGroupPrefix: 'g-',

        // Start index
        slideIndex: 0,

        // CSS classes
        classes: {
            previousHSlide: 'previous-hslide',
            nextHSlide: 'next-hslide',
            currentHSlide: 'current-hslide',

            previousVSlide: 'previous-vslide',
            nextVSlide: 'next-vslide',
            currentVSlide: 'current-vslide',

            activeFragment: 'active-frag',
            currentFragment: 'current-frag'
        },

        // Keyboard shortcuts
        shortcuts: {
            nextSlide: ['d', 'D'],
            previousSlide: ['a', 'A'],

            upSlide:['w','W'],
            downSlide:['s','S'],

            firstSlide: ['y', 'Y'],
            lastSlide: ['x', 'X'],

            nextFragment: ['ArrowRight'],
            previousFragment: ['ArrowLeft'],
            upFragment:['ArrowUp'],
            downFragment:['ArrowDown'],
        },

        clickOptions:{
            nextFragment: ['rightArrow','navigate-right'],
            previousFragment: ['leftArrow','navigate-left'],
            upFragment:['upArrow','navigate-up'],
            downFragment:['downArrow','navigate-down'],
        }

    };

    // Flags if Slide.initialize() has been called
    this.initialized = false;

    // Cached references to DOM elements
    this.dom = {};

    // Remember which directions that the user has navigated towards
	this.hasNavigatedRight = false,
	this.hasNavigatedDown = false,
    
    this.addEventListeners=this.addEventListeners();
    this.removeEventListeners=this.removeEventListeners();
}

SliderGenerator.prototype={

    initialize: function(opt){
        if(this.initialized) return 
        this.initialized=true;

        //console.log("Initalization");
        //Cache references to key DOM elements
		this.dom.wrapper = document.querySelector( '.presentr' );
        this.dom.slides = document.querySelector( '.presentr .slides' );

        // Copy options over to our config object
        extend( this._options, opt );
    
        this.start();
    },

    configure: function(){
        //Navigation Control
        this.dom.controls.style.display = this.config.controls ? 'block' : 'none';
        this.dom.controls.setAttribute( 'data-controls-layout', this.config.controlsLayout );
        this.dom.controls.setAttribute( 'data-controls-back-arrows', this.config.controlsBackArrows );

        //Progress Bar
        this.dom.progress.style.display = this.config.progress ? 'block' : 'none';

        //Image attribute
        wrapArray(this.dom.wrapper.querySelectorAll('img[data-src], video[data-src], audio[data-src]')).forEach(function(element){
            element.forEach(function(el){
                el.setAttribute( 'src', el.getAttribute( 'data-src' ) );
                el.setAttribute( 'data-lazy-loaded', '' );
                el.removeAttribute( 'data-src' );
            })
        })

        //background attribute
        //document.querySelectorAll('input[value][type="checkbox"]:not([value=""])');
        var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator

        wrapArray(this.dom.wrapper.querySelectorAll('section[data-background]:not([data-background=""])')).forEach(function(element){
            element.forEach(function(el){
                const background_att=el.getAttribute('data-background');
                const repeat_att=el.getAttribute('data-background-repeat');
                const backgroundSize=el.getAttribute('data-background-size');
                if(pattern.test(background_att)){
                    el.style=`background: url(${background_att}); `;
                }else{
                    el.style=`background: ${background_att}; `;
                }
                if(repeat_att){
                    el.style["background-repeat"]='repeat';
                }
                if(backgroundSize){
                    el.style["background-size"]=backgroundSize;
                }else{
                    el.style["background-size"]='cover';
                }
                
                el.removeAttribute('data-background');
                el.removeAttribute('data-background-repeat');
                el.removeAttribute('data-background-size');
            })
        });

        wrapArray(this.dom.wrapper.querySelectorAll('section[data-background-video]:not([data-background-video=""])')).forEach(function(element){
            element.forEach(function(el){
                const origin=el.innerHTML;
                el.innerHTML="";
                const video_src=el.getAttribute('data-background-video');
                const video = createSingletonNode(el, 'video','myVideo',
                `<source src="${video_src}" type="video/mp4"> Your browser does not support HTML5 video.`
                )
                el.querySelectorAll('video').forEach(function(e){
                    e.autoplay=true;
                    e.loop=true;
                    e.muted=true;
                    e.load();
                    console.log(e)
                })
                const content=createSingletonNode(el,'div','video-content',origin);
                el.removeAttribute('data-background-video')
            })
        });




    },

    start: function(){

        // Make sure we've got all the DOM elements we need
        this.setUpDom();
        // Updates the presentation to match the current configuration values
		this.configure();

        // Resolve slides and their fragments
        const {fragmentGroupPrefix} = this._options;
        var hSlides=this.dom.wrapper.querySelectorAll(this._options.HORIZONTAL_SLIDES_SELECTOR);
        //console.log(hSlides);
        for(const hslideElement of hSlides){
            const groupIndexes=new Map();
            const vSlides=hslideElement.querySelectorAll(this._options.VERTICAL_SLIDES_SELECTOR);
            //console.log(vSlides);
            var cacheVslides=[];
            if(Array.from(vSlides).length>0){
                for(const vslideElement of vSlides){
                    const fragments=Array.from(vslideElement.querySelectorAll(this._options.FRAGMENTS_SELECTOR)).map(v=>[v]);
                    //console.log(fragments);
                    for(let i=0; i<fragments.length; i++){
                        const group=Array.from(fragments[i][0].classList)
                            .find(v=> v.startsWith(fragmentGroupPrefix));
        
                        if (group) {
                            //console.log(group)
                            if (groupIndexes.has(group)) {
                                const [arr] = fragments.splice(i, 1);
                                fragments[groupIndexes.get(group)].push(arr[0]);
                                i--;
                            } else {
                                groupIndexes.set(group, i);
                            }
                        } 
                    }
                    cacheVslides.push({
                        el:vslideElement,
                        fragments,
                        fragmentIndex:0
                    })
                }
            }else{
                const fragments=Array.from(hslideElement.querySelectorAll(this._options.FRAGMENTS_SELECTOR)).map(v=>[v]);
                //console.log(fragments);
                for(let i=0; i<fragments.length; i++){
                    const group=Array.from(fragments[i][0].classList)
                        .find(v=> v.startsWith(fragmentGroupPrefix));
    
                    if (group) {
                        //console.log(group)
                        if (groupIndexes.has(group)) {
                            const [arr] = fragments.splice(i, 1);
                            fragments[groupIndexes.get(group)].push(arr[0]);
                            i--;
                        } else {
                            groupIndexes.set(group, i);
                        }
                    } 
                }
                cacheVslides.push({
                    el:"",
                    fragments,
                    fragmentIndex:0
                })
            }
            this._slides.push({
                el:hslideElement,
                cacheVslides,
                vSlidesIndex:0
            });
            
        }
        //console.log(this._slides)
        // Trigger
        //console.log(this._slides);
        this.jumpHSlide(this._options.slideIndex || 0);
        this.updateControls();
        this.updateProgress();
        //console.log(this._slides)
    },

    setUpDom: function(){
        // Progress bar
		this.dom.progress = createSingletonNode( this.dom.wrapper, 'div', 'progress', '<span></span>' );
        this.dom.progressbar = this.dom.progress.querySelector( 'span' );
        //console.log(this.dom.progress)

        // Arrow controls
		this.dom.controls = createSingletonNode( this.dom.wrapper, 'aside', 'controls',
        '<button name="leftArrow" class="navigate-left" aria-label="previous slide"><div class="controls-arrow"></div></button>' +
        '<button name="rightArrow" class="navigate-right" aria-label="next slide"><div class="controls-arrow"></div></button>' +
        '<button name="upArrow" class="navigate-up" aria-label="above slide"><div class="controls-arrow"></div></button>' +
        '<button name="downArrow" class="navigate-down" aria-label="below slide"><div class="controls-arrow"></div></button>' );

        this.dom.controlsLeft= wrapArray(this.dom.wrapper.querySelectorAll('.navigate-left'));
        this.dom.controlsRight=wrapArray(this.dom.wrapper.querySelectorAll('.navigate-right'));
        this.dom.controlsUp=wrapArray(this.dom.wrapper.querySelectorAll('.navigate-up'));
        this.dom.controlsDown=wrapArray(this.dom.wrapper.querySelectorAll('.navigate-down'));
        

        // The right and down arrows in the standard reveal.js controls
		this.dom.controlsRightArrow = this.dom.controls.querySelector( '.navigate-right' );
        this.dom.controlsDownArrow = this.dom.controls.querySelector( '.navigate-down' );

    },

    availableRoutes: function(){
        var verticalSlides=this._slides[this._hslideIndex].cacheVslides;
        var routes={
            left: this._hslideIndex>0,
            right: this._hslideIndex<this._slides.length-1,
            up: this._slides[this._hslideIndex].vSlidesIndex>0,
            down: this._slides[this._hslideIndex].vSlidesIndex <  verticalSlides.length-1,
        }
        return routes;
    },

    updateProgress: function(){
        //console.log(this.dom.wrapper.offsetWidth)
        // Update progress if enabled
		if( this.config.progress && this.dom.progressbar ) {
			this.dom.progress.style.width = this.getProgress() * this.dom.wrapper.offsetWidth + 'px';
		}
    },

    getProgress: function(){
        var totalCount=this.totalSlides;
        var pastCount=this.pastSlideCount;

        if(this._currentSlide){
            var allFragments= this._currentSlide.el.querySelectorAll('.frag');
            // If there are fragments in the current slide those should be
            // accounted for in the progress.
            if(allFragments.length>0){
                var visibleFragments=this._currentSlide.el.querySelectorAll('.active-frag');
                // This value represents how big a portion of the slide progress
				// that is made up by its fragments (0-1)
				var fragmentWeight = 0.9;

				// Add fragment progress to the past slide count
				pastCount += ( visibleFragments.length / allFragments.length ) * fragmentWeight;

            }
            
        }
        //console.log(pastCount/(totalCount-1));
        return pastCount/(totalCount-1);
    },

    updateControls: function(){
        var routes=this.availableRoutes();
        //console.log(routes);
        this.dom.controlsLeft.concat(this.dom.controlsRight)
                                .concat(this.dom.controlsUp)
                                .concat(this.dom.controlsDown).forEach(function(node){
                                    node.forEach(function(el){
                                        el.classList.remove('enabled');
                                        el.setAttribute('disabled','disabled');
                                    })
        });
        if(routes.left) this.dom.controlsLeft.forEach(function(node){ node.forEach(function(el){el.classList.add('enabled'); el.removeAttribute('disabled');})});
        if(routes.right) this.dom.controlsRight.forEach(function(node){ node.forEach(function(el){el.classList.add('enabled'); el.removeAttribute('disabled');})});
        if(routes.up) this.dom.controlsUp.forEach(function(node){ node.forEach(function(el){el.classList.add('enabled'); el.removeAttribute('disabled');})});
        if(routes.down) this.dom.controlsDown.forEach(function(node){ node.forEach(function(el){el.classList.add('enabled'); el.removeAttribute('disabled');})});
    

    
        if(this.config.controlsTutorial){
            if(!this.hasNavigatedDown && routes.down){
                this.dom.controlsDownArrow.classList.add('highlight');
            }else{
                this.dom.controlsDownArrow.classList.remove('highlight');
                if(!this.hasNavigatedRight && routes.right && this._hslideIndex===0){
                    this.dom.controlsRightArrow.classList.add('highlight');
                }else{
                    this.dom.controlsRightArrow.classList.remove('highlight');
                }
            }
        }
    
    },

    addEventListeners: function(){
        document.addEventListener('keyup', e=>{
            const match = cv => cv === e.code || cv === e.key;
            const {shortcuts} = this._options;
            const fns = ['nextSlide', 'previousSlide','upSlide','downSlide', 'lastSlide', 'firstSlide', 'nextFragment', 'previousFragment', 'upFragment','downFragment']; // Available shortcuts

            // Find corresponding shortcut action
            const target = Object.keys(shortcuts).find(v => {
                const code = shortcuts[v];
                return Array.isArray(code) ? code.find(match) : match(code);
            });

            target&& fns.includes(target) && this[target]();
        })

        
        document.addEventListener('click',e=>{
            //console.log(e.target.parentNode.className.includes('navigate-down'))
            const match =cv => cv===e.target.parentNode.name || e.target.parentNode.className.includes(cv);
            const {clickOptions} =this._options;
            const fns =['nextFragment', 'previousFragment', 'upFragment','downFragment'];

            // Find corresponding click action
            const target = Object.keys(clickOptions).find(v => {
                const code = clickOptions[v];
                return Array.isArray(code) ? code.find(match) : match(code);
            });

            target&& fns.includes(target) && this[target]();
        })

        // console.log(document.querySelectorAll('.navigate-down'))

        // wrapArray(document.querySelectorAll('.navigate-down')).forEach(function(el){console.log(el)});

        // this.dom.controlsLeft.forEach(function(el){el.addEventListener('click', this.previousFragment, false)});
        // this.dom.controlsRight.forEach(function(el){el.addEventListener('click', this.nextFragment, false)});
        // this.dom.controlsUp.forEach(function(el){el.addEventListener('click', this.upFragment, false)});
        // this.dom.controlsDown.forEach(function(el){el.addEventListener('click', this.downFragment, false)});
    },

    removeEventListeners:function(){
        document.removeEventListener('keyup', e=>{
            const match = cv => cv === e.code || cv === e.key;
            const {shortcuts} = this._options;
            const fns = ['nextSlide', 'previousSlide', 'upSlide','downSlide','lastSlide', 'firstSlide', 'nextFragment', 'previousFragment','upFragment','downFragment']; // Available shortcuts

            // Find corresponding shortcut action
            const target = Object.keys(shortcuts).find(v => {
                const code = shortcuts[v];
                return Array.isArray(code) ? code.find(match) : match(code);
            });

            target&& fns.includes(target) && this[target]();
        })

        document.removeEventListener('click',e=>{
            const match =cv => cv===e.target.parentNode.name;
            const {clickOptions} =this._options;
            const fns =['nextFragment', 'previousFragment', 'upFragment','downFragment'];

            // Find corresponding click action
            const target = Object.keys(clickOptions).find(v => {
                const code = clickOptions[v];
                return Array.isArray(code) ? code.find(match) : match(code);
            });

            target&& fns.includes(target) && this[target]();
        })
    },

    /* eslint-disable callback-return */
    _emit: function(event, args = {}) {
        for (const cb of this._boundEventListener[event]) {
            if (cb({
                presentr: this,
                ...args
            }) === false) {
                return false;
            }
        }

        //console.log(this._boundEventListener[event]);

        return true;
    },


    firstSlide: function() {
        this.jumpHSlide(0);
    },

    lastSlide: function() {
        this.jumpHSlide(this._slides.length - 1);
    },

    upSlide: function(){
        this.jumpVSlide(this._currentHSlide.vSlidesIndex - 1);
    },

    downSlide: function(){
        this.hasNavigatedDown=true;
        this.jumpVSlide(this._currentHSlide.vSlidesIndex + 1);
    },

    nextSlide: function() {
        this.hasNavigatedRight=true;
        this.jumpHSlide(this._hslideIndex + 1);
    },

    previousSlide: function() {
        this.jumpHSlide(this._hslideIndex - 1);
    },

    jumpVSlide: function(index) {
        const {_options} = this;
        const slide = this._currentHSlide;

        if (!this._emit('beforeSlide', {
            from: slide.vSlidesIndex,
            to: index
        })) return;

        // Jump to next / previous slide if no further fragments
        if (index < 0 || index>=slide.cacheVslides.length) {
            return false;
        }

        slide.vSlidesIndex=index;

        const {classes} = _options;
        const cs = wrapArray(classes.currentVSlide);
        const ps = wrapArray(classes.previousVSlide);
        const ns = wrapArray(classes.nextVSlide);

        for (let i = 0; i < slide.cacheVslides.length; i++) {
            const classl = slide.cacheVslides[i].el.classList;
            classl.remove(...ps);
            classl.remove(...ns);
            classl.remove(...cs);
            if (i === index) {
                classl.remove(...ps);
                classl.remove(...ns);
                classl.add(...cs);
            } else if (i < index) {
                classl.remove(...cs);
                classl.add(...ps);
            } else if (i > index) {
                classl.remove(...cs);
                classl.add(...ns);
            }
        }

        // Fire events
        this._emit('slide');
        this._emit('action');
        this.updateControls();
        this.updateProgress();
        return true;
    },



    jumpHSlide: function(index) {
        const {_slides, _options} = this;

        // Validate
        if (index < 0 || index >= _slides.length) {
            return false;
        }

        if (!this._emit('beforeSlide', {
            from: this._hslideIndex,
            to: index
        })) return;

         // Apply index
         this._hslideIndex = index;

        const {classes} = _options;
        const cs = wrapArray(classes.currentHSlide);
        const ps = wrapArray(classes.previousHSlide);
        const ns = wrapArray(classes.nextHSlide);

        for (let i = 0; i < _slides.length; i++) {
            const classl = _slides[i].el.classList;

            if (i === index) {
                classl.remove(...ps);
                classl.remove(...ns);
                classl.add(...cs);
                if(_slides[index].cacheVslides && _slides[index].cacheVslides.length>1){
                    this.jumpVSlide(_slides[index].vSlidesIndex);
                }
            } else if (i < index) {
                classl.remove(...cs);
                classl.add(...ps);
            } else if (i > index) {
                classl.remove(...cs);
                classl.add(...ns);
            }
        }
        // Fire event
        this._emit('slide');
        this._emit('action');
        this.updateControls();
        this.updateProgress();
        return true;
    },

    upFragment:function(){
        this.jumpFragment(this._currentVSlide.fragmentIndex - 1, "v");
    },

    downFragment:function(){
        this.hasNavigatedDown=true;
        this.jumpFragment(this._currentVSlide.fragmentIndex + 1, "v");
    },

    nextFragment: function() {
        this.hasNavigatedRight=true;
        if(this._currentVSlide){
            this.jumpFragment(this._currentVSlide.fragmentIndex + 1, "h");
        }else{
            this.nextSlide();
        }
    },

    previousFragment: function() {
        if(this._currentVSlide){
            this.jumpFragment(this._currentVSlide.fragmentIndex - 1, "h");
        }else{
            this.previousSlide();
        }
    },

    jumpFragment: function(index, direction) {
        const slide = this._currentVSlide;

        if (!this._emit('beforeFragment', {
            from: slide.fragmentIndex,
            to: index
        })) return;

        // Jump to next / previous slide if no further fragments
        if (index < 0) {
            if(direction==='v'){
                return this.upSlide();
            }else{
                return this.previousSlide();
            }
        } else if (index > slide.fragments.length) {
            if(direction==='v'){
                return this.downSlide();
            }else{
                return this.nextSlide();
            }
        }

        slide.fragmentIndex = index;

        // Apply class for previous and current fragment(s)
        const {activeFragment, currentFragment} = this._options.classes;
        const {fragments} = slide;

        const af = wrapArray(activeFragment);
        const cf = wrapArray(currentFragment);
        for (let i = 0; i < fragments.length; i++) {
            for (const sf of fragments[i]) {
                sf.classList.remove(...cf);
                sf.classList.remove(...af);

                if (i < (index - 1)) {
                    sf.classList.add(...af);
                } else if (i === (index - 1)) {
                    sf.classList.add(...af);
                    sf.classList.add(...cf);
                }
            }
        }

        // Fire events
        this._emit('fragment');
        this._emit('action');
        this.updateControls();
        this.updateProgress();
        return true;
    },

    get _currentHSlide(){
        return this._slides[this._hslideIndex];
    },

    get _currentVSlide(){
        const index=this._slides[this._hslideIndex].vSlidesIndex;
        return this._slides[this._hslideIndex].cacheVslides[index];
    },

    get _currentSlide(){
        if(this._slides[this._hslideIndex].cacheVslides.length>1){
            return this._currentVSlide;
        }else{
            return this._currentHSlide;
        }
    },

    get totalSlides() {
        var totalCount=0;
        this._slides.forEach(function(hSlide){
            totalCount+=hSlide.cacheVslides.length;
        });
        return totalCount;
    },

    get pastSlideCount(){
        var totalCount=0;
        const curVSlideIndex=this._slides[this._hslideIndex].vSlidesIndex;

        for(var i=0; i<this._hslideIndex; i++){
            totalCount+=this._slides[i].cacheVslides.length;
        }
        totalCount+=curVSlideIndex;
        return totalCount;
    },

    get globalFragmentCount() {
        return this._slides.reduce((acc, cv) => acc + cv.fragments.length, 0);
    },

    get totalFragments() {
        return this._currentVSlide.fragments.length;
    },

    get slideIndex() {
        return this._hslideIndex;
    },

    get fragmentIndex() {
        return this._currentVSlide.fragmentIndex;
    },
}