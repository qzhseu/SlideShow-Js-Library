"use strict"; 
let slide1=document.querySelector('.slide1');
const sg1=new SlideDanceGenerator(slide1)
sg1.create({
    progress : true,
    controls : true,
    showNumberOfPage : true,
    autoplay : false,
    editMode : true,
    controlsPosition : 'edges', //'edges' or 'bottom-right',
    fontFamily : " 'Satisfy', Helvetica, sans-serif ",
    autoplayTimeInterval: 2000,
})
