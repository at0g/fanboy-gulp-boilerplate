# Fanboy gulp boilerplate

## Another boilerplate - What does it do?
 
- Preprocess CSS with Stylus
- Postprocess CSS with CSS Pleeease
- Automatically optimise images (jpg, png, gif) files imagemin
- Automatically optimise SVG graphics with SVGO and compile into a SVG Sprite
- Combine and minify Javascript
- Automatically create sourcemaps for CSS and Javascript
- Create hash revisions (unique filenames) of your front-end assets (css, js, images, svg) for better cache control 
- Automatically replace image urls in CSS files with the correct hashed filenames
- Compile HTML from handlebars templates (includes helper to resolve hashed filenames)
- Preview with the bundled connect server
- See your changes automatically with Live Reload

## Getting started

Install *node* and *npm* http://nodejs.org/

Install bower `npm install --global bower`

Install gulp `npm install --global gulp`

Install project dependencies `npm install && bower install`

Run the default task `gulp`

Navigate your favourite browser to `http://localhost:3000`

Edit the files in `src` directory - as long as `gulp` is running the files will be built automatically in the `dist` 
directory and the changes will be updated in your browser.