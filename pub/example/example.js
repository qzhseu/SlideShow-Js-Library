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

let slide2=document.querySelector('.slide2');
const sg2=new SlideDanceGenerator(slide2)
sg2.create({
    editMode : true,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide3=document.querySelector('.slide3');
const sg3=new SlideDanceGenerator(slide3)
sg3.create({
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide4=document.querySelector('.slide4');
const sg4=new SlideDanceGenerator(slide4)
sg4.create({
    editMode : true,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide5=document.querySelector('.slide5');
const sg5=new SlideDanceGenerator(slide5)
sg5.create({
    autoplay : true,
    autoplayTimeInterval: 2000,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide6=document.querySelector('.slide6');
const sg6=new SlideDanceGenerator(slide6)
sg6.create({
    autoplay : true,
    autoplayTimeInterval: 4000,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide7=document.querySelector('.slide7');
const sg7=new SlideDanceGenerator(slide7)
sg7.create({
    autoplay : false,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide8=document.querySelector('.slide8');
const sg8=new SlideDanceGenerator(slide8)
sg8.create({
    autoplay : false,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})

let slide9=document.querySelector('.slide9');
const sg9=new SlideDanceGenerator(slide9)
sg9.create({
    autoplay : false,
    controlsPosition : 'bottom-right', //'edges' or 'bottom-right',
})