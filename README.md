# js-library-quzhaohu
## Slide.js

### [Landing Page](https://polar-dawn-62675.herokuapp.com/example/)
### [Document](https://polar-dawn-62675.herokuapp.com/)

### Getting Started

The most common slide.js use case is to have a single presentation which covers the full viewport.We also support running multiple presentations in parallel on the same page.

**Single Presentation**
1. Download slide.js from the github.
2. Link to jQuery and the library along with the styles.
   ```xml
   <link rel="stylesheet" href="/css/slideDance.css">
   <link rel="stylesheet" href="/css/theme/black.css" id="theme">
   <script defer src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
   <script defer type="text/javascript" src="./js/slideDance.js"></script>
   ```
3. Create a "SlideDanceGenerator" and call the create the function.
   ``` javascript
   const sg=new SlideDanceGenerator();
   sg.create();
   ```
4. Now create your slide using slide.js. Wrap your slides with a div, the class attribute of the div is slideDance. Each slide should inside <slide> tag.
    ```html
    <div class="slideDance">
        <div class="slides">
            <slide>
                ...
            </slide>
       </div>
    </div>
    ```

**Multiple Presentation**
To run multiple presentations side-by-side on the same page you can create instances of the SlideDance class. The SlideDanceGenerator accepts an optional argument, the .slideDance HTML element root of the presentation.
```html
    <div class="slideDance slide1">...</div>
    <div class="slideDance slide2">...</div>
    
    <script>
        let slide1=document.querySelector('.slide1');
        const sg1=new SlideDanceGenerator(slide1);
        sg1.create();
    
        let slide2=document.querySelector('.slide2');
        const sg2=new SlideDanceGenerator(slide2);
        sg2.create();
    </script>
```
If you want to show code block, your code will be displayed as plain text on the slide. But if you want to present code with code syntax highlight, you can use external modules like [highlight.js](https://highlightjs.org/) and so on.
