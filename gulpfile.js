/*!
 * gulp
 * $ npm install gulp-ruby-sass gulp-autoprefixer gulp-cssnano gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
 */
var isWin = process.platform === "win32";

// Load plugins
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    del = require('del'),
    browserSync = require('browser-sync').create(),
    mainNPMFiles = require('npmfiles'),

gutil = require('gulp-util');

var themeName = 'bbTheme';


var assets = {
    src: 'src/assets/',
    dest: 'public_html/wp-content/themes/' + themeName + '/assets/'
};

var wpThemes = {
    src : 'src/wp-theme/',
    dest: 'public_html/wp-content/themes/' + themeName + '/'
};



var paths =
    {
        styles: {
            src: assets.src + 'styles',
            dest: assets.dest + 'styles'
        },
        script: {
            src: assets.src + 'scripts',
            dest: assets.dest + 'scripts'
        },
        libs: {
            src: assets.src + 'libs',
            dest: assets.dest + 'libs'
        },
        "models": {
            src: assets.src + 'models',
            dest: assets.dest + 'models'
        },
        fonts: {
            src: assets.src + 'fonts/**/*.*',
            dest: assets.dest + 'styles/fonts'
        },
        images: {
            src: assets.src + 'images',
            dest: assets.dest + 'images'
        }
    };

sass.compiler = require('node-sass');

// Styles
gulp.task('styles', function () {
    return gulp.src(paths.styles.src + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(browserSync.reload({stream: true}));

});

// Fonts
gulp.task('fonts', function () {
    return gulp.src(paths.fonts.src)
        .pipe(gulp.dest(paths.fonts.dest))
});



// Search model vengono copiati tutti i file che sono dentro model
gulp.task('models', function () {
    return gulp.src(paths['models'].src + '/**/*.*')
        .pipe(gulp.dest(paths['models'].dest))
});



gulp.task('angularTemplates',function(){
    // template di angular per direttive ecc...
    return gulp.src(paths.script.src + '/templates/**/*.html')
        .pipe(angularTemplates({
            standalone : true,
            transformUrl: function (url) {

                if(isWin){
                    url = url.replace("\\app\\templates\\", "");

                }else{
                    url = url.replace("/app/templates/", "");
                }

                return url;
                // return url.replace(/\.tpl\.html$/, '.html')
            }
        }))
        .pipe(gulp.dest(paths.script.src + '/templates/'));
});

// Scripts vengono copiati tutti i file che sono dentro scripts
gulp.task('scripts', gulp.series(function () {


    var appPath = paths.script.src + '/app/';


    return gulp.src([
        appPath + 'modules/*.js',
        appPath + 'app.js',
        appPath + 'services/**/*.js',
        appPath + 'run.js',
        appPath + 'controllers/**/*.js',
        appPath + 'directives/**/*.js'
    ])
        .pipe(concat('app.js'))
        .pipe(gulp.dest(paths.script.dest))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify().on('error', function (err) {
            gutil.log(gutil.colors.red('[Error]'), err.toString());
        }))
        .pipe(gulp.dest(paths.script.dest))
}));



// Images
gulp.task('images', function () {
    return gulp.src(paths.images.src + '/**/*.*')
        .pipe(cache(imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true,
            svgoPlugins: [{removeViewBox: true}]
        })))
        .pipe(gulp.dest(paths.images.dest));
});


// Clean
gulp.task('clean', function () {
    return del(
        [
            paths.styles.dest,
            paths.script.dest,
            paths.fonts.dest,
            paths['models'].dest,
            paths.libs.dest,
            //paths.chunks.dest,
            //paths.resources.dest,
            //paths.templates.dest
        ]
    );
});

gulp.task('theme:style', function () {
    return gulp.src(wpThemes.src+'style.css')
        .pipe(gulp.dest(wpThemes.dest));

});


gulp.task('theme:files', function () {
    console.log(wpThemes.src+'**/*.php',wpThemes.dest);
    return gulp.src(wpThemes.src+'**/*.php')
        .pipe(gulp.dest(wpThemes.dest));
});


gulp.task('browser_reload', function () {
    return browserSync.reload()
});

// Default build (without serve) for production
gulp.task('build', gulp.series('theme:style' , 'theme:files' ,'styles', 'models', 'scripts', 'images', 'fonts'));

// Static Server + watching scss/html files
gulp.task('serve', gulp.series('build', function () {

    browserSync.init({
        proxy: process.env.PROXY || ""
        // browser: "google chrome"
    });

    // Watch .scss files
    gulp.watch( wpThemes.src+'**/*.php', gulp.series('theme:files'));

    // Watch .scss files
    gulp.watch(paths.styles.src + '/**/*.scss', gulp.series('styles'));

    // Watch .js files
    gulp.watch(paths.script.src + '/app/**/*.js', gulp.series('scripts'));


    // Watch .json files
    gulp.watch(paths['models'].src + '/**/*.json', gulp.series('models'));

    // Watch image files
    gulp.watch(paths.images.src + '/**/*', gulp.series('images'));

    gulp.watch("**/*.php").on('change', browserSync.reload);
    gulp.watch("*.php").on('change', browserSync.reload);
}));



// Default task
gulp.task('default', gulp.series('serve'));