var gulp        = require('gulp'),
    fs          = require('fs'),
    path        = require('path'),
    sourcemaps  = require('gulp-sourcemaps'),
    connect     = require('gulp-connect'),
    rev         = require('gulp-rev'),
    stylus      = require('gulp-stylus'),
    please      = require('gulp-pleeease'),
    handlebars  = require('gulp-compile-handlebars'),
    rename      = require('gulp-rename'),
    replace     = require('gulp-batch-replace'),
    imagemin    = require('gulp-imagemin'),
    del         = require('del'),
    runSequence = require('run-sequence')
;



var paths = {
    src: {
        dir: path.join(process.cwd(), 'src'),
        images: {
            dir: path.join(process.cwd(), 'src/assets/img')
        },
        styles: {
            dir: path.join(process.cwd(), 'src/styles'),
            includes: [
                path.join(process.cwd(), 'src/stylus-lib')
            ]
        },
        templates: {
            dir: 'src/templates/'
        }
    },
    build: {
        dir: path.join(process.cwd(), 'dist'),
        css: {
            dir: './dist/css'
        },
        images: {
            dir: './dist/assets/images'
        }
    }
};



gulp.task('clean:build', function(cb){
    del([paths.build.dir], cb);
});

gulp.task('clean:css', function(cb){
    del([paths.build.css.dir], cb);
});

gulp.task('clean:images', function(cb){
    del([paths.build.images.dir], cb);
});

gulp.task('webserver', function(){
    connect.server({
        livereload: true,
        port: 3000,
        root: [paths.build.dir]
    })
});

gulp.task('stylus', function(){
    var manifest = JSON.parse(fs.readFileSync(paths.build.dir + '/bundle.json', 'utf8')),
        replacements = [],
        keys = Object.keys(manifest),
        isImg = /\.(png|jpg|gif|svg)/
        ;

    for(var i = 0; i<keys.length; i++){
        var key = keys[i];
        if(key.match(isImg)){
            replacements.push([ key, '/' + manifest[key] ]);
        }
    }

    return gulp.src(paths.src.styles.dir + '/**/*.styl')
        .pipe( sourcemaps.init() )
        .pipe( replace( replacements ))
        .pipe( stylus({
            paths: paths.src.styles.includes
        }) )
        .pipe( please({ minifier: false }) )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest(paths.build.css.dir ) )
});

gulp.task('imagemin', function(){
    return gulp.src(paths.src.images.dir + '/**/*', { base: paths.src.dir } )
        .pipe( imagemin() )
        .pipe( rev() )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( rev.manifest('bundle.json', {
            base: paths.build.dir, merge: true
        }) )
        .pipe( gulp.dest(paths.build.dir + '/bundle.json') )
    ;
});

gulp.task('handlebars', function(){
    var manifest = JSON.parse(fs.readFileSync(paths.build.dir + '/bundle.json', 'utf8')),
        helpers  = require('./src/templates/helpers')
        ;
    return gulp.src('./src/templates/index.hbs')
        .pipe( handlebars(manifest, { helpers: helpers }) )
        .pipe( rename('index.html') )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( connect.reload() )
        ;
});


gulp.task('bundle:css', function(){

    return gulp.src( paths.build.css.dir + '/**/*.css', { base: paths.build.dir })
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( rev() )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( rev.manifest({
            base: paths.build.dir,
            merge: true,
            path: paths.build.dir + '/bundle.json'
        }) )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('compile:with-images', function(cb){
    runSequence(
        'clean:images',
        'imagemin',
        'compile',
        cb
    )
});

gulp.task('compile', function(cb){
    runSequence(
        'clean:css',
        'stylus',
        'bundle:css',
        'handlebars',
        cb
    )
});

gulp.task('watch', function(){

    var stylusWatchTargets = [paths.src.styles.dir + '/**/*.styl'].concat(paths.src.styles.includes.map(function(p){
        return p + '/**/*.styl'
    }));
    gulp.watch(stylusWatchTargets, ['compile']);
    gulp.watch(paths.src.images.dir + '**/*', ['compile:with-images']);
    gulp.watch(paths.src.templates.dir + '**/*', ['handlebars'] );
});

gulp.task('default', ['watch', 'webserver', 'compile:with-images']);