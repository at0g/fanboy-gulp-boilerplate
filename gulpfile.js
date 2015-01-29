var del         = require('del'),
    fs          = require('fs'),
    gulp        = require('gulp'),
    replace     = require('gulp-batch-replace'),
    cheerio     = require('gulp-cheerio'),
    handlebars  = require('gulp-compile-handlebars'),
    concat      = require('gulp-concat'),
    connect     = require('gulp-connect'),
    imagemin    = require('gulp-imagemin'),
    please      = require('gulp-pleeease'),
    rename      = require('gulp-rename'),
    rev         = require('gulp-rev'),
    size        = require('gulp-size'),
    sourcemaps  = require('gulp-sourcemaps'),
    stylus      = require('gulp-stylus'),
    svgo        = require('gulp-svgo'),
    svgstore    = require('gulp-svgstore'),
    uglify      = require('gulp-uglify'),
    path        = require('path'),
    runSequence = require('run-sequence')
;



var paths = {
    src: {
        dir: path.join(process.cwd(), 'src'),
        images: {
            dir: path.join(process.cwd(), 'src/assets/img')
        },
        js: {
            dir: path.join(process.cwd(), 'src/js')
        },
        svg: {
            dir: path.join(process.cwd(), 'src/assets/svg')
        },
        styles: {
            dir: path.join(process.cwd(), 'src/styles'),
            includes: [
                path.join(process.cwd(), 'src/styles/lib'),
                path.join(process.cwd(), 'src/vendor/bootstrap-stylus')
            ]
        },
        templates: {
            dir: 'src/templates/'
        }
    },
    build: {
        dir: path.join(process.cwd(), 'build'),
        manifest: 'bundle.json',
        css: {
            dir: './build/css'
        },
        images: {
            dir: './build/assets/images'
        },
        js: {
            dir: './build/js'
        },
        svg: {
            dir: './build/assets/svg'
        }
    }
};

var manifest = {};


function writeManifest(){
    /* @todo: There is probably a fix for the merge option on the way to gulp-rev.
        When rev is fixed, the gulp.dest calls will probably need updating too.
    */
    return rev.manifest({
        base: paths.build.dir,
        merge: true,
        path: paths.build.dir + '/' + paths.build.manifest
    });
}



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

gulp.task('clean:js', function(cb){
    del([paths.build.js.dir], cb);
});

gulp.task('webserver', function(){
    connect.server({
        livereload: true,
        port: 3000,
        root: [paths.build.dir]
    })
});

gulp.task('reload:manifest', function(cb){
    var json = fs.readFileSync(paths.build.dir + '/' + paths.build.manifest, 'utf8');
    manifest = JSON.parse(json);
    cb();
});

gulp.task('js', function(){
    return gulp.src([
        paths.src.dir + '/vendor/svg4everybody/svg4everybody.js',
        paths.src.dir + '/vendor/zepto/zepto.js',
        paths.src.js.dir + '/**/*.js'
    ], { base: paths.src.dir })
        .pipe( sourcemaps.init() )
        .pipe( concat('js/app.min.js') )
        .pipe( size() )
        .pipe( uglify() )
        .pipe( size() )
        .pipe( rev() )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( writeManifest() )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('stylus', function(){
    var replacements = [],
        keys = Object.keys(manifest),
        isImg = /\.(png|jpg|gif|svg)/,
        includes = paths.src.styles.includes.map(function(p){
            return '!' + p + '/**/*.styl';
        }),
        src = [paths.src.styles.dir + '/**/*.styl'].concat(includes)
        ;

    for(var i = 0; i<keys.length; i++){
        var key = keys[i];
        if(key.match(isImg)){
            replacements.push([ key, '/' + manifest[key] ]);
        }
    }

    return gulp.src(src)
        .pipe( sourcemaps.init() )
        .pipe( replace( replacements ))
        .pipe( stylus({
            paths: paths.src.styles.includes
        }) )
        .pipe( please() )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest(paths.build.css.dir ) )
});

gulp.task('imagemin', function(){
    return gulp.src(paths.src.images.dir + '/**/*', { base: paths.src.dir } )
        .pipe( imagemin() )
        .pipe( rev() )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( writeManifest() )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('svgstore', function(){
    return gulp.src( paths.src.svg.dir + '/**/*.svg' )
        .pipe( svgo() )
        .pipe( cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
            },
            parserOptions: { xmlMode: true }
        }) )
        .pipe( svgstore({ fileName: 'assets/svg/svgstore.svg' }) )
        .pipe( rev() )
        .pipe( gulp.dest( paths.build.dir ) )
        .pipe( writeManifest() )
        .pipe( gulp.dest(paths.build.dir) )
    ;
});

gulp.task('bundle:css', function(){

    return gulp.src( paths.build.css.dir + '/**/*.css', { base: paths.build.dir })
        .pipe( sourcemaps.init({ loadMaps: true }) )
        .pipe( rev() )
        .pipe( sourcemaps.write('.') )
        .pipe( gulp.dest(paths.build.dir) )
        .pipe( writeManifest() )
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

gulp.task('compile:js', function(cb){
    runSequence(
        'clean:js',
        'js',
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
        'js',
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
    gulp.watch(paths.src.js.dir + '**/*.js', ['compile:js']);
});

gulp.task('default', ['watch', 'webserver', 'compile:all']);