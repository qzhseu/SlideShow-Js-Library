"use strict";

(function(global, document, $) { 

	function SlideDanceGenerator(wrapperDom) {
        this.horizontalSlideIndex=0; // Index of Horizontal Slide
        this.verticalSlideIndex=0; // Index of vertical Slide
        this.slides=[]; // Structure of slides
        this.goRightDirection = false; //Record direction user go (Left and Right)
        this.goDownDirection = false; //Record direction user go (Up and Down)
        this.currentEditElement = null;

        //Record dom elements
        this.wrapperDom=wrapperDom;
        this.slidesDom={};
        this.controlsDom={};
        this.controlArrowsDom={};
        this.progressBarDom={};
        this.numberOfPage={};
        this.playButton={};

        //Configuration
        this.configures={
            controls : true, //Controls arrows on screen
            controlsPosition : 'bottom-right', //Position of controls on screen
            controlsTutorial: true,
            progress: true, // Whether or not to show progress bar
            keyboard: true, // Whether or not enable keyboard to control slides
            editMode: false, //Whether or not enable edit mode
            autoplay:false, //Autoplay slide
            autoplayTimeInterval: 3000,
            pause: false, //Pause autoplay
            fontFamily: "'Times New Roman', Times, serif", //Set font family
            showNumberOfPage:true, //Whether or not to show number of slides
            onReady: function(){},
            onSlideChanged: function(){},
            onEnd: function(){},
        }

        //Support options
        this.selector={
            SlideDance : '.slideDance',
            // AllSlides: '.slideDance .slides',
            AllSlides: '.slides',
            HorizontalSlideSelector : '.slides > slide',
            VerticalSlideSelector : 'slide',
            FragmentSelector : 'fragment',
        }

        //operations
        this.keyOperations={
            nextHorizontalSlide: ['d', 'D'],
            preHorizontalSlide: ['a', 'A'],

            preVerticalSlide:['w','W'],
            nextVerticalSlide:['s','S'],

            firstSlide: ['f', 'F'],
            lastSlide: ['l', 'L'],

            autoPlayNextSlide : ['Space'],
            autoPlayPause : ['q','Q'],

            saveEditedHTML :['o','O'],

            nextFragment: ['ArrowRight'],
            preFragment: ['ArrowLeft'],
            upFragment:['ArrowUp'],
            downFragment:['ArrowDown'],

            zoomIn : ['+'],
            zoomOut : ['_'],
        }

        setTimeout(function(){ 
            this.addEventListeners=this.addEventListeners();
            this.removeEventListeners=this.removeEventListeners();
        }.bind(this), 1);
    }
    
    let slideTransition= "all 0.6s";
    //let tLeft,tTop //When mouse drag element, the position of mouse to selected element.
    let dragging=false // dragging state
    let resizing=false //resizing state
    let rotating=false //rotate state
    let originalMouseX=0;
    let originalMouseY=0;
    let resizeButton='';
    let keysPressed = {};


    const arrowsClassActive=["rightArrow","leftArrow","downArrow","upArrow"];
    const arrowsClassDisactive=["rightArrow-disable","leftArrow-disable","downArrow-disable","upArrow-disable"];
    

    let classesName={
        activeFragment: 'activeFragment',
        fragment: 'fragment'
    }

    function setConfig(config, configuration){
        for(var i in config){
            if(i in configuration){
                configuration[i]=config[i];
            }
        }
    }

    function childNodeOfSlideDance(el){
        const parentNode=el.parentNode;
        if(parentNode){
            const parentTagName=el.parentNode.tagName;
            const parentClassName=el.parentNode.className;
            if(parentClassName.includes('slideDance')) return true;
            if(parentTagName==='BODY') return false;
            return childNodeOfSlideDance(parentNode)
        }
        return false;
    }

    function transformX(index, HoritonalIndex){
        const diff= (index-HoritonalIndex)*100;
        return `translateX(${diff}vw)`;
    }

    function transformY(index, VerticalIndex){
        const diff= (index-VerticalIndex)*100;
        return `translateY(${diff}vw)`;
    }

    function setTranslate(el, xPos, yPos){
        const transformList = el.style.transform.split(" ");
        for(var i=0; i<transformList.length; i++){
            if(transformList[i].includes("translate")){
                transformList[i+1]='';
                transformList[i] = "translate(" +xPos +"px," +yPos + "px)";
                const transform=transformList.join(' ');
                el.style.transform = transform;
                return ;
            }
        }
        el.style.transform = "translate(" +xPos +"px," +yPos + "px)" + el.style.transform;
    }

    function decideSelectedElement(e){
        if(e.target.tagName==='IMG' || e.target.tagName==='VIDEO' || e.target.tagName==='CODE'){
            return e.target.parentNode;
        }else if(e.target.className==='lineNumber' || e.target.className==='codeLine'){
            return e.target.parentNode.parentNode;
        }else{
            return e.target;
        }
    }

    function createElement(container, tagName, className, innerHTML, direction=true){
        const childrenNodes= container.childNodes;
        for(var i=0; i<childrenNodes.length; i++){
            var temp=childrenNodes[i];
            if(temp.className === className && temp.innerHTML===innerHTML){
                return temp;
            }
        }
        var newNode=document.createElement(tagName);
        newNode.className = className;
        newNode.innerHTML = typeof innerHTML ==='string' ? innerHTML : "";
        //newNode.style = styles;
        if(direction){
            container.appendChild( newNode );
        }else{
            let theFirstChild = container.firstChild
            container.insertBefore(newNode, theFirstChild)
        }
        return newNode;
    }

    function removeElement(container, tagName, className){
        const childrenNodes = container.childNodes;
        const deletedNodes=[];
        for(var i=0; i<childrenNodes.length; i++){
            var childNode=childrenNodes[i];
            var childClassName = childNode.className;
            var childTagName = childNode.tagName;
            if((childClassName && childClassName.includes(className)) || (childTagName && childTagName.includes(tagName))){
                deletedNodes.push(childNode);
            }
        }
        deletedNodes.forEach(deleted=>{
            container.removeChild(deleted)
        })
    }

    function removeEmptyLinesStartAndEnd(codes){
        const codeLines=codes.split('\n');
        let index=0;
        //Remove empty lines from the begin
        while(index<codeLines.length){
            if(codeLines[index].trim() === ''){
                codeLines.splice(index--, 1);
                index++;
            }else{
                break;
            }
        }
        //Remove empty lines from the end
        index=codeLines.length-1;
        while(index>=0){
            if(codeLines[index].trim() === ''){
                codeLines.splice(index, 1);
                index--;
            }else{
                break;
            }
        }
        return codeLines.join('\n');
    }

    function parseHighlightLine(highlightLinesBreak){
        const highlightLines=[];
        for(var i=0; i<highlightLinesBreak.length; i++){
            if(highlightLinesBreak[i].includes('-')){
                var range=highlightLinesBreak[i].split('-');
                for(var j=parseInt(range[0]); j<=parseInt(range[1]); j++){
                    highlightLines.push(j)
                }
            }else{
                highlightLines.push(parseInt(highlightLinesBreak[i]))
            }
        }
        return highlightLines;
    }

    function setHighLightLines(el, highlightLines){
        const childrenNodes=el.childNodes;
        childrenNodes.forEach((child, index)=>{
            const line=index+1;
            if(!highlightLines.includes(line)){
                child.style.opacity='0.3';
            }
        });
    }

    function isURL(str) {
        return !!str.match(/(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/g);
    }

	SlideDanceGenerator.prototype = {
        create: function(opt){
            const {selector} = this;
            this.wrapperDom = this.wrapperDom ?  this.wrapperDom : document.querySelector( selector.SlideDance );
            this.slidesDom = this.wrapperDom.querySelector( selector.AllSlides );
            setConfig(opt, this.configures);
            this.createDom();
            this.initialize(this.configures.onReady());
            this.startPresentation();
        },

        createDom: function(){
            //Create Progress Bar
            this.progressBarDom=createElement(this.wrapperDom, 'div', 'progressBar', '<span></span>');

            //Create number of page
            this.numberOfPage=createElement(this.wrapperDom, 'div', 'numberOfPage', '<span>1/10</span>').querySelectorAll('span')[0];

            //Create play/pause button
            this.playButton=createElement(this.wrapperDom, 'div', 'button play', '')

            //Control arrows
            if(this.configures.controlsPosition!=='edges'){
                var innerHTML=
                '<div name="upArrow" class="quart"><a class="upArrow">&#10094;</a></div>' +
                '<div name="rightArrow" class="quart"><a class="rightArrow">&#10094;</a></div>' +
                '<div name="downArrow" class="quart"><a class="downArrow">&#10094;</a></div>' +
                '<div name="leftArrow" class="quart"><a class="leftArrow">&#10094;</a></div>';
                var controls = createElement( this.wrapperDom, 'div', 'controls',innerHTML);
                this.controlsDom = this.wrapperDom.querySelectorAll('.controls');
            }else{
                var innerHTML=
                '<div name="upArrow" class="quartEdgeUp"><a class="upArrow">&#10094;</a></div>' +
                '<div name="rightArrow" class="quartEdgeRight"><a class="rightArrow">&#10094;</a></div>' +
                '<div name="downArrow" class="quartEdgeDown"><a class="downArrow">&#10094;</a></div>' +
                '<div name="leftArrow" class="quartEdgeLeft"><a class="leftArrow">&#10094;</a></div>';
                var controls = createElement( this.wrapperDom, 'div', 'controlsEdge',innerHTML);
                this.controlsDom = this.wrapperDom.querySelectorAll('.controlsEdge');
            }
            
            this.controlArrowsDom.upArrow = this.wrapperDom.querySelectorAll('[name="upArrow"]');
            this.controlArrowsDom.rightArrow = this.wrapperDom.querySelectorAll('[name="rightArrow"]');
            this.controlArrowsDom.downArrow = this.wrapperDom.querySelectorAll('[name="downArrow"]');
            this.controlArrowsDom.leftArrow = this.wrapperDom.querySelectorAll('[name="leftArrow"]');
        },

        initialize: function(callback){

            const { fragment } = classesName;
            const {selector, progressBarDom, controlsDom, wrapperDom, configures, slidesDom, numberOfPage, slides, playButton} =this;

            //Set overflow of slideDance's parent node. 
            this.wrapperDom.parentNode.style.overflow='hidden'

            //Set progress bar
            progressBarDom.style.display = configures.progress ? 'block' : 'none';

            //Set playButton 
            playButton.style.display= (configures.autoplay && configures.pause) ? 'block' : 'none';

            //Set controls button
            controlsDom[0].setAttribute( 'data-controls-layout', configures.controlsPosition );
            controlsDom[0].style.display = configures.controls ? 'block' : 'none';

            //Set number of page
            numberOfPage.style.display =configures.showNumberOfPage ? 'block' : 'none';

            //Set font family
            wrapperDom.style.fontFamily =  configures.fontFamily;

            //Set specific element's font 
            wrapperDom.querySelectorAll('[data-fontFamily]').forEach(function(ele){
                const fontFamily=ele.getAttribute('data-fontFamily');
                ele.style.fontFamily=fontFamily;
            })

            //Set code block
            wrapperDom.querySelectorAll('pre code[data-code-trim]').forEach(function(ele){
                
                const innerHTML = removeEmptyLinesStartAndEnd(ele.innerHTML);
                const highlightLine=ele.getAttribute('data-hightlight-line');
                ele.innerHTML="";
                const codeLines=innerHTML.split('\n');
                var padding = Number.MAX_VALUE;
                for(var i=0; i<codeLines.length; i++){
                    if(codeLines[i].length===0) continue;
                    //Replace tab to 4 spaces
                    codeLines[i] = codeLines[i].replace(/\t/g, '    ');
                    // Replace special character
                    var curPadding = codeLines[i].search(/\S/); 
                    padding =Math.min(padding, curPadding);
                }
                for(var i=0; i<codeLines.length; i++){
                    if(codeLines[i].length===0){
                        createElement(ele, 'div','codeLine',"<span class='lineNumber'>"+(i+1)+" </span></br>");
                    }else{
                        codeLines[i]=codeLines[i].substring(padding);
                        createElement(ele, 'div','codeLine',"<span class='lineNumber'>"+(i+1)+' </span>'+ codeLines[i]);
                    }
                }

                if(highlightLine){
                    const highlightLinesBreak = highlightLine.split(',');
                    const highlightLines=parseHighlightLine(highlightLinesBreak);
                    setHighLightLines(ele, highlightLines);
                }
            })

            //Set image, video, audio src
            wrapperDom.querySelectorAll('img[data-src]').forEach(function(ele){
                const width = ele.getAttribute('width') ? ele.getAttribute('width') : 700;
                const height = ele.getAttribute('height') ? ele.getAttribute('height') : 400;

                ele.setAttribute( 'src', ele.getAttribute( 'data-src' ) );
                ele.setAttribute( 'loading', 'lazy' );
                ele.setAttribute('width', '100%');
                ele.setAttribute('height', '100%');
                ele.removeAttribute('data-src');

                const newNode = createElement(ele.parentNode, 'div', 'image', ele.outerHTML);
                newNode.style.width=width + 'px';
                newNode.style.height=height + 'px';
                ele.parentNode.removeChild(ele);
            })

            wrapperDom.querySelectorAll('video[data-src]').forEach(function(ele){
                const width = ele.getAttribute('width') ? ele.getAttribute('width') : 700;
                const height = ele.getAttribute('height') ? ele.getAttribute('height') : 400;

                ele.setAttribute( 'src', ele.getAttribute( 'data-src' ) );
                ele.setAttribute( 'loading', 'lazy' );
                ele.setAttribute("controls","controls");
                ele.setAttribute('width', '100%');
                ele.setAttribute('height', '100%');
                ele.removeAttribute( 'data-src' );

                const newNode = createElement(ele.parentNode, 'div', 'video', ele.outerHTML);
                newNode.style.width=width + 'px';
                newNode.style.height=height + 'px';
                ele.parentNode.removeChild(ele);
            })

            //Set backgrounds attribute
            //Image and Gif
            wrapperDom.querySelectorAll('slide[data-background]').forEach(function(slide){
                const background = slide.getAttribute('data-background');
                const backgroundRepeat = slide.getAttribute('data-background-repeat');
                const backgroundSize = slide.getAttribute('data-background-size');

                if(background && isURL(background)){
                    slide.style=`background: url(${background}); `;
                }else if(background){
                    slide.style=`background: ${background}; `;
                }
                if(backgroundRepeat){
                    slide.style["background-repeat"]='repeat';
                }
                if(backgroundSize){
                    slide.style["background-size"]=backgroundSize;
                }else{
                    slide.style["background-size"]='100% 100%';
                }
                slide.removeAttribute('data-background-size');
                slide.removeAttribute('data-background-repeat');
                slide.removeAttribute('data-background');
            })

            //Vedio
            wrapperDom.querySelectorAll('slide[data-background-video]').forEach(function(slide){
                const backgroundVedio=slide.getAttribute('data-background-video');
                const video = createElement(slide, 'video','videoBackground',
                    `<source src="${backgroundVedio}" type="video/mp4"> Your browser does not support HTML5 video.`,false)
                video.autoplay=true;
                video.loop=true;
                video.muted=true;
                video.load();
                slide.removeAttribute('data-background-video')
            })
           
            //Create slide collections
            var HorizontalSlides = slidesDom.querySelectorAll(selector.HorizontalSlideSelector);
            for(const horizontalSlideElement of HorizontalSlides){
                const verticalSlides = horizontalSlideElement.querySelectorAll(selector.VerticalSlideSelector);
                var cacheVerticalslides=[];
                if(Array.from(verticalSlides).length>0){
                    for(const verticalSlideElement of verticalSlides){
                        const fragments=verticalSlideElement.querySelectorAll(selector.FragmentSelector)
                        for(const frag of fragments) frag.className=fragment;
                        cacheVerticalslides.push({
                            VSlides:verticalSlideElement,
                            fragments,
                            fragmentIndex:0
                        })
                    }
                }else{
                    const fragments=horizontalSlideElement.querySelectorAll(selector.FragmentSelector)
                    for(const frag of fragments) frag.className=fragment;
                    cacheVerticalslides.push({
                        VSlides:"",
                        fragments,
                        fragmentIndex:0
                    })
                }
                slides.push({
                    HSlides : horizontalSlideElement,
                    cacheVerticalslides,
                    verticalSlidesIndex:0
                })
            }

            if (typeof callback == "function") callback(); 
        },

        startPresentation: function(){
            this.slidesDom.style.display="block";
            this.goToHorizontalSlide(this.horizontalSlideIndex || 0);
            this.updateControlButtons();
            this.updateProgressBar();
            if(this.configures.autoplay){
                this.autoPlayTimer = setInterval(function(){ this.autoPlayNextSlide(); }.bind(this), this.configures.autoplayTimeInterval);
            }
        },

        addEventListeners: function(){
            var pressingEditEnter = false;

            //Listen for keyboard action
            document.addEventListener('keyup', e=>{
                const {keyOperations} =this;
                const key= e.key;
                const code=e.code;
                keysPressed[e.key] = true;

                if(key==='Shift'){
                    pressingEditEnter=false;
                }

                const targetAction = Object.keys(keyOperations).find(option=>{
                    const keyCode=keyOperations[option];
                    return keyCode.includes(code) || keyCode.includes(key);
                })
                targetAction && this[targetAction](e);
            })

            document.addEventListener('keydown', e=>{
                const key= e.key;
                delete keysPressed[key];
                if(key==='Shift'){
                    pressingEditEnter=true;
                }
            })

            //Listen click the button arrows
            this.controlArrowsDom.rightArrow.forEach(function(el){el.addEventListener('click', ()=>{this.nextFragment()}, false)}.bind(this));
            this.controlArrowsDom.leftArrow.forEach(function(el){el.addEventListener('click', ()=>{this.preFragment()}, false)}.bind(this));
            this.controlArrowsDom.upArrow.forEach(function(el){el.addEventListener('click', ()=>{this.upFragment()}, false)}.bind(this));
            this.controlArrowsDom.downArrow.forEach(function(el){el.addEventListener('click', ()=>{this.downFragment()}, false)}.bind(this));

            //Play button
            this.playButton.addEventListener('click',()=>{this.autoPlayPause()}, false)

            //Mouse click select a element
            document.addEventListener('click', e=>{
                //e.preventDefault()
                this.selectElement(e, pressingEditEnter);
            })

            //Listen for mouse click when dragging element
            document.addEventListener('mousedown', e=>{
                e.preventDefault();
                const target = decideSelectedElement(e);
                //Drag element
                this.mouseDownDragEl(e, target);
                //Resize element
                this.mouseDownResizeEl(e, target);
                //Rotate element
                this.mouseDownRotateEl(e, target);
            })

            //Release mouse
            document.addEventListener('mouseup', e=>{
                e.preventDefault()
                resizing=false;
                rotating=false;
                const target = decideSelectedElement(e);
                //Drag element
                if(target===this.currentEditElement){
                    dragging=false;
                    this.currentEditElement.initialX = this.currentEditElement.currentX;
                    this.currentEditElement.initialY=this.currentEditElement.currentY;
                    this.currentEditElement.style.transition = ''
                }
            })

            //Drag element
            document.addEventListener('mousemove', e=>{
                e.preventDefault()
                const target = decideSelectedElement(e);
                //Drag element
                this.mouseMoveDragEl(e, target);
                
                //Resize element
                this.mouseMoveResizeEl(e);
               
                //Rotating element
                this.mouseMoveRotateEl(e);
                
            })
        },

        removeEventListeners: function(){
            document.removeEventListener('keyup', e=>{
                const {keyOperations} =this;
                const code= e.key;
                const targetAction = Object.keys(keyOperations).find(option=>{
                    const keyCode=keyOperations[option];
                    return keyCode.includes(code);
                })
                targetAction && this[targetAction]();
            })

             //Listen click the button arrows
             this.controlArrowsDom.rightArrow.forEach(function(el){el.removeEventListener('click', ()=>{this.nextFragment()}, false)}.bind(this));
             this.controlArrowsDom.leftArrow.forEach(function(el){el.removeEventListener('click', ()=>{this.preFragment()}, false)}.bind(this));
             this.controlArrowsDom.upArrow.forEach(function(el){el.removeEventListener('click', ()=>{this.upFragment()}, false)}.bind(this));
             this.controlArrowsDom.downArrow.forEach(function(el){el.removeEventListener('click', ()=>{this.downFragment()}, false)}.bind(this));
 
             //Play button
             this.playButton.removeEventListener('click',()=>{this.autoPlayPause()}, false)
        },

        //Check available routes
        availableRoutes: function(){
            const {slides, horizontalSlideIndex}=this;
            var verticalSlides=slides[horizontalSlideIndex].cacheVerticalslides;
            var verticalIndex=slides[horizontalSlideIndex].verticalSlidesIndex;
            var fragmentList=verticalSlides[0].fragments;
            var fragmentIndex=verticalSlides[0].fragmentIndex;

            var routes={
                left: horizontalSlideIndex>0 || fragmentIndex>0,
                right: horizontalSlideIndex<slides.length-1 || fragmentIndex<fragmentList.length,
                up: verticalIndex>0,
                down: verticalIndex <  verticalSlides.length-1,
            }
            return routes;
        },

        updateControlButtons: function(){
            var routes=this.availableRoutes();
            const arrowsDom=[this.controlArrowsDom.rightArrow, this.controlArrowsDom.leftArrow, this.controlArrowsDom.downArrow, this.controlArrowsDom.upArrow];

            arrowsDom.forEach(function(dom , domIndex){
                dom.forEach(function(ele){
                    ele.childNodes.forEach(function(child){
                        child.classList.remove(arrowsClassActive[domIndex]);
                        child.classList.add(arrowsClassDisactive[domIndex]);
                    })
                })
            })

            if(routes.right) this.controlArrowsDom.rightArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove(arrowsClassDisactive[0]); child.classList.add(arrowsClassActive[0]);})})
            if(routes.left) this.controlArrowsDom.leftArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove(arrowsClassDisactive[1]); child.classList.add(arrowsClassActive[1]);})})
            if(routes.down) this.controlArrowsDom.downArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove(arrowsClassDisactive[2]); child.classList.add(arrowsClassActive[2]);})})
            if(routes.up) this.controlArrowsDom.upArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove(arrowsClassDisactive[3]); child.classList.add(arrowsClassActive[3]);})})

            if(this.configures.controlsTutorial){
                if(!this.goDownDirection && routes.down){
                    this.controlArrowsDom.downArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.add('highlightArrow')})})
                }else{
                    this.controlArrowsDom.downArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove('highlightArrow')})})
                    if(!this.goRightDirection && routes.right && this.horizontalSlideIndex===0){
                        this.controlArrowsDom.rightArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.add('highlightArrow')})})
                    }else{
                        this.controlArrowsDom.rightArrow.forEach(function(ele){ele.childNodes.forEach(function(child){child.classList.remove('highlightArrow')})})
                    }
                }
            }
        },

        updateProgressBar: function(){
            if( this.configures.progress && this.progressBarDom ) {
                this.progressBarDom.style.width = this.getProgressPercentage() * this.wrapperDom.offsetWidth + 'px';
            }
        },

        //Get percentage of progress bar
        getProgressPercentage: function(){
            var totalCount=this._totalSlides;
            var pastCount=this._pastSlideCount;
            if(this._currentSlide){
                const allFragments = this._currentSlide.HSlides ? this._currentSlide.HSlides.querySelectorAll(this.selector.FragmentSelector) : this._currentSlide.VSlides.querySelectorAll(this.selector.FragmentSelector);
                if(allFragments.length>0){
                    const numOfVisibleFragments = this._currentSlide.HSlides ? this._currentSlide.cacheVerticalslides[0].fragmentIndex : this._currentSlide.fragmentIndex;
                    const weight=0.8;
                    pastCount += (numOfVisibleFragments/allFragments.length) * weight;
                }
            }
            return pastCount/(totalCount-1);
        },

        //Update number of page
        updateNumberOfPage: function(){
            var totalCount=this._totalSlides;
            var pastCount=this._pastSlideCount;
            this.numberOfPage.innerText = `${pastCount+1}/${totalCount}`;
        },

        /**Action for jumping to the first slide**/
        firstSlide: function() {
            this.goToHorizontalSlide(0, this.configures.onSlideChanged());
        },

        /**Action for jumping to the last slide**/
        lastSlide: function() {
            this.goToHorizontalSlide(this.slides.length - 1);
            this.goToVerticalSlide(this.slides[this.horizontalSlideIndex].cacheVerticalslides.length-1, this.configures.onSlideChanged());
        },

        /**Action to go to a slide**/
        goToSlide(indexh=0, indexv=0, indexf=0){
            this.goToHorizontalSlide(indexh);
            this.goToVerticalSlide(indexv, this.configures.onSlideChanged());
            this.goToFragment(indexf);
        },

        /** Actions for jump between horizontal slides **/
        nextHorizontalSlide: function() {
            this.goRightDirection=true;
            this.goToHorizontalSlide(this.horizontalSlideIndex + 1,this.configures.onSlideChanged());
            if(this._currentSlideFragmentList.length>0){
                this.goToFragment(this._currentSlideFragmentList.length, 'h')
            }
        },
    
        preHorizontalSlide: function() {
            this.goToHorizontalSlide(this.horizontalSlideIndex - 1, this.configures.onSlideChanged());
            this._currentSlideFragmentList;
            if(this._currentSlideFragmentList.length>0){
                this.goToFragment(this._currentSlideFragmentList.length, 'h')
            }
        },

        goToHorizontalSlide: function( HorizontalIndex, callback ){
            const {slides} =this;

            HorizontalIndex = HorizontalIndex < 0 ? 0 : HorizontalIndex >= slides.length ? slides.length-1 : HorizontalIndex;
            this.horizontalSlideIndex=HorizontalIndex;
            for(var i=0; i<slides.length; i++){
                //const HStyle =window.getComputedStyle(slides[i].HSlides);
                if(i!==HorizontalIndex){
                    slides[i].HSlides.style.transform=transformX(i, HorizontalIndex);
                    slides[i].HSlides.style.transition=slideTransition;
                    if(slides[i].cacheVerticalslides && slides[i].cacheVerticalslides.length>1){
                        this.updateVerticalSlidePosition(slides[i].verticalSlidesIndex, i);
                    }
                }else{
                    slides[i].HSlides.style.transform="none";
                    slides[i].HSlides.style.transition=slideTransition;
                    slides[i].HSlides.style.filter="none";
                    if(slides[i].cacheVerticalslides && slides[i].cacheVerticalslides.length>1){
                        this.goToVerticalSlide(slides[i].verticalSlidesIndex);
                    }
                }
            }
            this.updateControlButtons();
            this.updateProgressBar();
            this.updateNumberOfPage();
            this.saveEditedHTML();
            if (typeof callback == "function") callback(); 
        },

        /** Actions for jump between vertical slides **/
        preVerticalSlide: function(){
            this.goToVerticalSlide(this._currentHorizontalSlide.verticalSlidesIndex - 1,this.configures.onSlideChanged());
            this._currentSlideFragmentList;
            if(this._currentSlideFragmentList.length>0){
                this.goToFragment(this._currentSlideFragmentList.length, 'v')
            }
        },

        nextVerticalSlide: function(){
            this.goDownDirection=true;
            this.goToVerticalSlide(this._currentHorizontalSlide.verticalSlidesIndex + 1, this.configures.onSlideChanged());
            if(this._currentSlideFragmentList.length>0){
                this.goToFragment(this._currentSlideFragmentList.length, 'v')
            }
        },

        goToVerticalSlide: function( VerticalIndex,callback ){
            const curHorizontalSlide = this._currentHorizontalSlide;
            const curVerticalSlides = curHorizontalSlide.cacheVerticalslides;
            VerticalIndex = VerticalIndex < 0 ? 0 : VerticalIndex >= curVerticalSlides.length ? curVerticalSlides.length-1 : VerticalIndex;
            curHorizontalSlide.verticalSlidesIndex = VerticalIndex;
            for(var i=0; i<curVerticalSlides.length; i++){
                if(i!==VerticalIndex){
                    curVerticalSlides[i].VSlides.style.transform=transformY(i, VerticalIndex);
                    curVerticalSlides[i].VSlides.style.transition=slideTransition;
                }else{
                    curVerticalSlides[i].VSlides.style.transform="none";
                    curVerticalSlides[i].VSlides.style.transition=slideTransition;
                    curVerticalSlides[i].VSlides.style.filter="none";
                }
            }
            this.updateControlButtons();
            this.updateProgressBar();
            this.updateNumberOfPage();
            this.saveEditedHTML();
            if (typeof callback == "function") callback(); 
        },

        updateVerticalSlidePosition: function( VerticalIndex , HorizontalIndex){
            const horizontalSlide = this.slides[HorizontalIndex];
            const verticalSlides=horizontalSlide.cacheVerticalslides;
            if ( VerticalIndex < 0 || VerticalIndex >= verticalSlides.length) {
                return false;
            } 
            for(var i=0; i<verticalSlides.length; i++){
                if(verticalSlides[i].VSlides.style.transform) continue;
                if(i!==VerticalIndex){
                    verticalSlides[i].VSlides.style.transform=transformY(i, VerticalIndex);
                    verticalSlides[i].VSlides.style.transition=slideTransition;
                }else{
                    verticalSlides[i].VSlides.style.transform="none";
                    verticalSlides[i].VSlides.style.transition="none";
                    verticalSlides[i].VSlides.style.filter="none";
                }
            }
        },

        /**Action for next slide in autoplay mode**/
        autoPlayNextSlide: function(){
            if(this.configures.autoplay){
                var routes=this.availableRoutes();
                if(routes.down){
                    this.nextVerticalSlide();
                }else if(routes.right){
                    this.nextHorizontalSlide();
                }else{
                    this.resetSlide();
                }
            }
        },

        autoPlayPause: function(){
            const {configures, playButton}=this;
            configures.pause=!configures.pause;
            playButton.style.display= (configures.autoplay && configures.pause) ? 'block' : 'none';
            if(configures.autoplay && configures.pause){
                clearInterval(this.autoPlayTimer);
            }else{
                this.autoPlayTimer = setInterval(function(){ this.autoPlayNextSlide(); }.bind(this), this.configures.autoplayTimeInterval);
            }
        },

        resetSlide: function(){
            this.horizontalSlideIndex=0;
            for(var i=0; i<this.slides.length; i++){
                if(this.slides[i].verticalSlidesIndex!==0){
                    this.slides[i].verticalSlidesIndex=0;
                    this.slides[i].cacheVerticalslides.forEach(function(vSlide, index){
                        vSlide.VSlides.style.transform=transformY(index, 0);
                    })
                }
            }
            this.goToHorizontalSlide(0);
        },

        /**Actions for jump between fragments**/
        nextFragment: function(){
            this.goRightDirection=true;
            if(this._currentVerticalSlide){
                this.goToFragment(this._currentVerticalSlide.fragmentIndex + 1, "h");
            }else{
                this.nextHorizontalSlide();
            }
        },

        preFragment: function(){
            if(this._currentVerticalSlide){
                this.goToFragment(this._currentVerticalSlide.fragmentIndex - 1, "h");
            }else{
                this.preHorizontalSlide();
            }
        },

        upFragment: function(){
            this.goToFragment(this._currentVerticalSlide.fragmentIndex - 1, "v");
        },

        downFragment: function(){
            this.goDownDirection=true;
            this.goToFragment(this._currentVerticalSlide.fragmentIndex + 1, "v");
        },

        goToFragment: function(fragIndex, direction){
            const verticalSlide = this._currentVerticalSlide;
            const {activeFragment, fragment} = classesName;
            const {fragments} = verticalSlide;
            if (fragIndex < 0) {
                if(direction==='v'){
                    return this.preVerticalSlide();
                }else{
                    return this.preHorizontalSlide();
                }
            } else if (fragIndex > verticalSlide.fragments.length) {
                if(direction==='v'){
                    return this.nextVerticalSlide();
                }else{
                    return this.nextHorizontalSlide();
                }
            }
            verticalSlide.fragmentIndex = fragIndex;

            const af = activeFragment;
            const f = fragment;
            for (var i = 0; i < fragments.length; i++) {
                if(i<(fragIndex)){
                    fragments[i].className=af
                }else if(i===(fragIndex)){
                    fragments[i].className=f
                }
            }
            this.updateControlButtons();
            this.updateProgressBar();
            this.saveEditedHTML();
        },

        /**Action for saving edited HTML**/
        saveEditedHTML: function(){
            if(this.configures.editMode && this.currentEditElement){
                this.currentEditElement.classList.remove('selectedElement');
                removeElement(this.currentEditElement, null, 'resizer');
                removeElement(this.currentEditElement, null, 'rotate');
                this.currentEditElement=null;
            }
        },

        /**Action for editting elements**/
        selectElement: function(e,pressingEditEnter){
            if(this.configures.editMode && pressingEditEnter){
                if(this.currentEditElement){
                    this.currentEditElement.classList.remove('selectedElement'); 
                    removeElement(this.currentEditElement, null, 'resizer');
                    removeElement(this.currentEditElement, null, 'rotate');
                    this.currentEditElement.style.position='';
                    this.currentEditElement=null; 
                }
                const selectedElement = decideSelectedElement(e);
                
                const belongSlideDance = childNodeOfSlideDance(selectedElement);
                const tagName=selectedElement.tagName;
                const className=selectedElement.className;
                const unableDragEle=['videoBackground','codeLine','lineNumber'];
                console.log(selectedElement, belongSlideDance)
                if(belongSlideDance && tagName!=='SLIDE' && !arrowsClassActive.includes(className) && !arrowsClassDisactive.includes(className) && !unableDragEle.includes(className)){
                    console.log("Selected")
                    selectedElement.classList.add('selectedElement')
                    createElement(selectedElement, 'div', 'resizer-top-left', '')
                    createElement(selectedElement, 'div', 'resizer-top-right', '')
                    createElement(selectedElement, 'div', 'resizer-bottom-left', '')
                    createElement(selectedElement, 'div', 'resizer-bottom-right', '')
                    createElement(selectedElement, 'div', 'rotate', '')
                    selectedElement.style.position='relative';
                    this.currentEditElement=selectedElement;
                }
            }
        },

        mouseDownDragEl(e, target){
            if(target === this.currentEditElement){
                dragging=true;
                if(!this.currentEditElement.xOffset){
                    this.currentEditElement.xOffset=0;
                }

                if(!this.currentEditElement.yOffset){
                    this.currentEditElement.yOffset=0;
                }
                this.currentEditElement.initialX=e.clientX - this.currentEditElement.xOffset;
                this.currentEditElement.initialY=e.clientY-this.currentEditElement.yOffset;
                this.currentEditElement.style.transition = 'none'
            }
        },

        mouseDownResizeEl(e, target){
            if(target.className.includes('resizer')){
                resizing=true;
                resizeButton=e.target.className;
                originalMouseX=e.pageX;
                originalMouseY=e.pageY;
            }
        },

        mouseDownRotateEl(e, target){
            if(target.className.includes('rotate')){
                rotating=true;
                originalMouseX=e.pageX;
                originalMouseY=e.pageY;
            }
        },

        mouseMoveDragEl(e, target){
            if(dragging && target===this.currentEditElement){
                this.currentEditElement.currentX=e.clientX - this.currentEditElement.initialX;
                this.currentEditElement.currentY=e.clientY - this.currentEditElement.initialY;
                this.currentEditElement.xOffset = this.currentEditElement.currentX;
                this.currentEditElement.yOffset = this.currentEditElement.currentY;
                setTranslate(this.currentEditElement, this.currentEditElement.currentX, this.currentEditElement.currentY);
            }
        },

        mouseMoveResizeEl(e){
            if(resizing){
                var originalWidth=this.currentEditElement.offsetWidth;
                var originalHeight=this.currentEditElement.offsetHeight;
                var originalL=this.currentEditElement.getBoundingClientRect().left;
                var originalT=this.currentEditElement.getBoundingClientRect().top;
                var originalR=this.currentEditElement.getBoundingClientRect().right;
                var originalB=this.currentEditElement.getBoundingClientRect().bottom;

                if(resizeButton.includes('bottom-right')){
                    this.currentEditElement.style.width = e.pageX - originalL +'px';
                    this.currentEditElement.style.height = e.pageY - originalT + 'px';
                }else if(resizeButton.includes('bottom-left')){
                    this.currentEditElement.style.width = (originalR - e.pageX) +'px'
                    this.currentEditElement.style.height = e.pageY - originalT + 'px';
                }else if(resizeButton.includes('top-left')){
                    this.currentEditElement.style.width = originalWidth - (e.pageX - originalL) + 'px';
                    this.currentEditElement.style.height = originalHeight - (e.pageY -  originalT) + 'px';
                }else if(resizeButton.includes('top-right')){
                    this.currentEditElement.style.width = e.pageX - originalL +'px';
                    this.currentEditElement.style.height = originalHeight - (e.pageY - originalT) +'px';
                }
            }
        },

        mouseMoveRotateEl(e){
            if(rotating){
                const diffX = originalMouseX-e.pageX;
                const transformList = this.currentEditElement.style.transform.split(" ");
                for(var i=0; i<transformList.length; i++){
                    if(transformList[i].includes("rotate")){
                        transformList[i] = 'rotate(' +diffX+'deg)';
                        const transform=transformList.join(' ');
                        this.currentEditElement.style.transform =transform;
                        return ;
                    }
                }
                this.currentEditElement.style.transform += 'rotate(' +diffX+'deg)';
            }
        },

        zoomIn(e){
            if(this.configures.editMode && this.currentEditElement){
                var style = window.getComputedStyle(this.currentEditElement, null).getPropertyValue('font-size');
                var fontSize = parseFloat(style);   
                this.currentEditElement.style.fontSize = (fontSize * 1.2 ) + 'px';
            }
        },

        zoomOut(e){
            if(this.configures.editMode && this.currentEditElement){
                var style = window.getComputedStyle(this.currentEditElement, null).getPropertyValue('font-size');
                var fontSize = parseFloat(style);   
                this.currentEditElement.style.fontSize = (fontSize * 0.8 ) + 'px';
            }
        },

        //toggle AutoSlide play
        toggleAutoSlide(){
            this.configures.autoplay=true;
            this.autoPlayTimer = setInterval(function(){ this.autoPlayNextSlide(); }.bind(this), this.configures.autoplayTimeInterval);
        },

        toggleEditMode(){
            this.configures.editMode=true;
        },
                 
        get _currentHorizontalSlide(){
            return this.slides[this.horizontalSlideIndex];
        },

        get _currentVerticalSlide(){
            const index=this.slides[this.horizontalSlideIndex].verticalSlidesIndex;
            return this.slides[this.horizontalSlideIndex].cacheVerticalslides[index];
        },

        get _currentSlideFragmentList(){
            const curSlide = this._currentSlide;
            if(curSlide.VSlides){
                return curSlide.fragments;
            }else{
                return curSlide.cacheVerticalslides[0].fragments;
            }
        },

        get _currentSlide(){
            if(this.slides[this.horizontalSlideIndex].cacheVerticalslides.length>1){
                return this._currentVerticalSlide;
            }else{
                return this._currentHorizontalSlide;
            }
        },

        get _totalSlides() {
            var totalCount=0;
            this.slides.forEach(function(slide){
                totalCount+=slide.cacheVerticalslides.length;
            });
            return totalCount;
        },
    
        get _pastSlideCount(){
            const { slides, horizontalSlideIndex } = this;
            var totalCount=0;
            const curVerticalSlideIndex = slides[horizontalSlideIndex].verticalSlidesIndex;
    
            for(var i=0; i<horizontalSlideIndex; i++){
                totalCount += slides[i].cacheVerticalslides.length;
            }
            totalCount += curVerticalSlideIndex;
            return totalCount;
        },

        get _isAutoSliding(){
            return this.configures.autoplay;
        },

        get _isPaused(){
            return this.configures.pause
        },

        get _isEditedMode(){
            return this.configures.editMode
        },
	}

	global.SlideDanceGenerator = global.SlideDanceGenerator || SlideDanceGenerator

})(window, window.document, $); // pass the global window object and jquery to the anonymous function. They will now be locally scoped inside of the function.
//Reference: https://github.com/hakimel/reveal.js/