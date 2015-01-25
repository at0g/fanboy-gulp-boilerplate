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
    svgstore    = require('gulp-svgstore'),
    del         = require('del'),
    runSequence = require('run-sequence')
;



var paths = {
    src: {
        dir: path.join(process.cwd(), 'src'),
        images: {
            dir: path.join(process.cwd(), 'src/assets/img')
        },
        svg: {
            dir: path.join(process.cwd(), 'src/assets/svg')
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
        manifest: 'bundle.json',
        css: {
            dir: './dist/css'
        },
        images: {
            dir: './dist/assets/images'
        },
        svg: {
            dir: './dist/assets/svg'
        }
    }
};

var manifest = {};




gulp.task('clean:build', function(cb){
    del([paths.build.dir], cb);
});

gulp.task('clean:css', function(cb){
    del([paths.build.css.dir], cb);
});

gulp.task('clean:images', function(cb){
    del([paths.build.images.dir], cb);
});

gulp.task('clean:svg', function(cb){
    del([paths.build.svg.dir], cb);
});

gulp.task('webserver', function(){
    connect.server({
        livereload: true,
        port: 3000,
        root: [paths.build.dir]
    })
});

gulp.task('reload:manifest', function(cb){
    fs.readFile(paths.build.dir + '/' + paths.build.manifest, {encoding: 'utf8'}, function(err, json){
        manifest = JSON.parse(json);
        cb(err, manifest);
    });
});

gulp.task('stylus', function(){
    var replacements = [],
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
        .pipe( rev.manifest({
            base: paths.build.dir,
            merge: true,
            path: paths.build.dir + '/' + paths.build.manifest
        }) )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('svgstore', function(){
    return gulp.src( paths.src.svg.dir + '/**/*.svg' )
        .pipe( svgstore({ fileName: 'assets/svg/svgstore.svg' }) )
        .pipe( rev() )
        .pipe( gulp.dest( paths.build.dir ) )
        .pipe( rev.manifest({
            base: paths.build.dir,
            merge: true,
            path: paths.build.dir + '/' + paths.build.manifest
        }) )
        .pipe( gulp.dest(paths.build.dir) )
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
            path: paths.build.dir + '/' + paths.build.manifest
        }) )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('handlebars', function(){
    var helpers = require('./src/templates/helpers');

    return gulp.src('./src/templates/index.hbs')
        .pipe( handlebars(manifest, { helpers: helpers }) )
        .pipe( rename('index.html') )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( connect.reload() )
        ;
});

gulp.task('compile:with-images', function(cb){
    runSequence(
        'clean:images',
        'imagemin',
        'reload:manifest',
        'compile:css',
        cb
    )
});

gulp.task('compile:svg', function(cb){
    runSequence(
        'clean:svg',
        'svgstore',
        'reload:manifest',
        'handlebars',
        cb
    );
});

gulp.task('compile:css', function(cb){
    runSequence(
        'clean:css',
        'reload:manifest',
        'stylus',
        'bundle:css',
        'reload:manifest',
        'handlebars',
        cb
    )
});

gulp.task('compile:all', function(cb){
    runSequence(
        'clean:build',
        'imagemin',
        'svgstore',
        'compile:css',
        cb
    );
});

gulp.task('watch', function(){

    var stylusWatchTargets = [paths.src.styles.dir + '/**/*.styl'].concat(paths.src.styles.includes.map(function(p){
        return p + '/**/*.styl'
    }));
    gulp.watch(stylusWatchTargets, ['compile:css']);
    gulp.watch(paths.src.images.dir + '**/*', ['compile:with-images']);
    gulp.watch(paths.src.templates.dir + '**/*', ['handlebars']);
    gulp.watch(paths.src.svg.dir + '**/*.svg', ['compile:svg']);
});

gulp.task('default', ['watch', 'webserver', 'compile:all']);