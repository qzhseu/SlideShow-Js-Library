"use strict"; 
hljs.initHighlightingOnLoad();
const sg=new SlideDanceGenerator()
sg.create({
    progress : true,
    controls : true,
    autoplay : false,
    editMode : true,
    showNumberOfPage : true,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
    fontFamily : " 'Satisfy', Helvetica, sans-serif ",
    autoplayTimeInterval: 2000,
    
    onSlideChanged: function(){
        console.log('SlideDance: Slide change');
    },

    onEnd: function(){
        console.log('SlideDance: End');
    }
})


