"use strict"; 

const sg=new SlideDanceGenerator()
sg.create({
    progress : true,
    controls : true,
    showNumberOfPage : true,
    autoplay : true,
    editMode : false,
    controlsPosition : 'edges', //'edges' or 'bottom-right',
    fontFamily : " 'Satisfy', Helvetica, sans-serif ",
    autoplayTimeInterval: 2000,
})