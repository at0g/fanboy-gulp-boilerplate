var gulp        = require('gulp'),
    fs          = require('fs'),
    path        = require('path'),
    sourcemaps  = require('gulp-sourcemaps'),
    rev         = require('gulp-rev'),
    stylus      = require('gulp-stylus'),
    please      = require('gulp-pleeease'),
    handlebars  = require('gulp-compile-handlebars'),
    rename      = require('gulp-rename'),
    del         = require('del')
;


gulp.task('clean:css', function(cb){
    del(['./dist/css'], cb);
});


gulp.task('stylus', ['clean:css'], function(){
    return gulp.src('./src/css/**/*.styl', { base: './src/css' })
        .pipe( sourcemaps.init() )
        .pipe( stylus({
            paths: [
                path.join(__dirname, './src/css'),
                path.join(__dirname, './src/stylus-lib')
            ]
        }) )
        .pipe( please({ minifier: false }) )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest('./dist/css') )
});


gulp.task('bundle', ['stylus'], function(){

    return gulp.src('./dist/css/*.css', { base: path.join(process.cwd(), 'dist') })
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( rev() )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest('./dist') )
        .pipe( rev.manifest('bundle.json', {
            base: path.join(process.cwd(), 'dist'),
            merge :true
        }) )
        .pipe( gulp.dest('dist/bundle.json') )
    ;
});

gulp.task('compile:html', ['bundle'], function(){
    var manifest = JSON.parse(fs.readFileSync(__dirname + '/dist/bundle.json', 'utf8')),
        helpers  = require('./src/templates/helpers')
    ;
    return gulp.src('./src/templates/index.hbs')
        .pipe( handlebars(manifest, { helpers: helpers }) )
        .pipe( rename('index.html') )
        .pipe( gulp.dest('./dist') )
    ;
});

gulp.task('watch', function(){
    gulp.watch(['./src/css/**/*.styl', './src/stylus-lib/**/*.styl'], ['compile:html']);
});

gulp.task('default', ['watch', 'compile:html']);