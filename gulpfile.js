(function() {
    'use strict';
    var nunjucksRender = require('gulp-nunjucks-render'), // Nunjucks templating system
        htmlbeautify = require('gulp-html-beautify'), // Beautifies HTML
        autoprefixer = require('gulp-autoprefixer'), // Autoprefixes CSS using regular CSS
        neat = require('node-neat').includePaths, // The Bourbon Neat grid system
        stripDebug = require('gulp-strip-debug'), // Strip console logs on --production
        gulpPngquant = require('gulp-pngquant'), // Optmise PNGs
        sourcemaps = require('gulp-sourcemaps'), // Line numbers pointing to your SCSS files
        runSequence = require('run-sequence'), // Run tasks sequentially
        cleanCSS = require('gulp-clean-css'), // Refactors CSS and combines MQs (Prod only)
        scsslint = require('gulp-scss-lint'), // SCSS Linting
        stylish = require('jshint-stylish'), // Style your jshint results
        imagemin = require('gulp-imagemin'), // Compress Images
        fontmin = require('gulp-fontmin'), // Font minification - Can also generates CSS
        rename = require('gulp-rename'), // Rename files i.e. in this case rename minified files to .min
        concat = require('gulp-concat'), // Merges all files in to 1
        jshint = require('gulp-jshint'), // Lint your JS on the fly
        uglify = require('gulp-uglify'), // JS minification (Prod only)
        notify = require('gulp-notify'), // Notifications upon task completion
        svgmin = require('gulp-svgmin'), // Minimises SVGs
        newer = require('gulp-newer'), // A Gulp plugin for passing through only those source files that are newer than corresponding destination files.
        babel = require('gulp-babel'), // ALlows for ES2015 support with this build system
        scss = require('gulp-sass'), // Libscss Pre-processor
        util = require('gulp-util'), // Used for prod deployment
        gulp = require('gulp'), // Gulp
        del = require('del'), // Clean folders and files
        browserSync = require('browser-sync').create(); // Create BS server
    // File Format
    var fileFormat = 'html',
        fileExt = '.' + fileFormat;

    // Paths object
    var src = {
        pages: 'src/pages/**/*' + fileExt,
        templates: 'src/templates/**/*',
        scss: 'src/styles/**/*.scss',
        js: 'src/scripts/**/*.js', // - if you change this path, then you'll need to update your .jshintignore file
        img: 'src/images/**/*.{jpg,gif,png}',
        svg: 'src/images/svgs/**/*.svg',
        fonts: 'src/fonts/**/*',
        docs: 'src/docs/**/*',
        favicons: 'src/favicons/**/*'
    };

    var dist = {
        pages: './',
        css: './',
        js: 'dist/assets/js',
        img: 'dist/assets/img',
        svg: 'dist/assets/img/svg',
        fonts: 'dist/assets/fonts',
        docs: 'dist/assets/docs',
        favicons: 'dist/assets/favicons'
    };

    var config = {
        maps: 'maps', // This is where your CSS and JS sourcemaps go
        reports: 'reports', // Lint reports go here
        lint: 'src/styles/*/**.scss', // Path of SCSS files that you want to lint
        lintExclude: '!src/styles/vendors/*.scss', // Path of SCSS files that you want to exclude from lint
        templates: 'src/templates/',
        pagesWatch: './*/**' + fileExt, // Directory where pages are output (Not sure why this glob pattern works)
        production: !!util.env.production // Used for prod deployment
    };

    // Browser Sync with code/HTML injection
    gulp.task('browser-sync', function() {
        browserSync.init({
            server: './',
            files: dist.css + '*.css'
        });
    });


    // Disable or enable pop up notifications
    var notifications = false;
    if (notifications) {
        process.env.DISABLE_NOTIFIER = true; // Uncomment to disables all notifications
    }

    // Files and folders to clean
    gulp.task('clean', function() {
        del([dist.pages + '*' + fileExt, dist.css + '/*.css', dist.js, dist.img, dist.fonts, dist.docs, dist.favicons, config.maps, config.reports]);
        return gulp.src('./')
            .pipe(notify({
                message: 'Folders cleaned successfully',
                onLast: true
            }));
    });

    // $ scss-lint - SCSS Linter
    gulp.task('scss-lint', function() {
        return gulp.src([config.lint + ', ' + config.lintExclude])
            .pipe(scsslint({
                'reporterOutputFormat': 'Checkstyle',
                'filePipeOutput': 'scssReport.xml',
                'config': 'scss-lint.yml'
            }))
            .pipe(gulp.dest(config.reports));
    });

    // ********************** //
    // *** Required Tasks *** //
    // ********************** //

    gulp.task('scss', function() {
        return gulp.src(src.scss)
            .pipe(sourcemaps.init())
            .pipe(scss({
                includePaths: [src.scss]
            }))
            .on('error', notify.onError(function(error) {
                return 'An error occurred while compiling scss.\nLook in the console for details.\n' + error;
            }))
            // FROM HERE:
            .pipe(autoprefixer({
                browsers: ['last 2 versions', 'ie 6-10'],
                cascade: false
            }))
            .pipe(config.production ? cleanCSS({ debug: true }, function(details) {
                console.log(details.name + ' file size before: ' + details.stats.originalSize + ' bytes');
                console.log(details.name + ' file size after: ' + details.stats.minifiedSize + ' bytes');
            }) : util.noop())
            // TO HERE
            .pipe(sourcemaps.write(config.maps))
            .pipe(gulp.dest(dist.css));
    });

    gulp.task('scripts', function() {
        return gulp.src(src.js)
            .pipe(jshint('.jshintrc'))
            .pipe(jshint.reporter('jshint-stylish'))
            .pipe(sourcemaps.init())
            .pipe(config.production ? stripDebug() : util.noop())
            .pipe(concat('main.js'))
            .pipe(gulp.dest(dist.js))
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(babel({
                presets: ['es2015']
            }))
            .on('error', notify.onError(function(error) {
                return 'An error occurred while compiling JS.\nLook in the console for details.\n' + error;
            }))
            .pipe(config.production ? uglify() : util.noop())
            .pipe(sourcemaps.write(config.maps))
            .pipe(gulp.dest(dist.js))
            .pipe(browserSync.stream({ once: true }))
    });

    gulp.task('nunjucks', function() {
        nunjucksRender.nunjucks.configure([src.templates]);
        return gulp.src(src.pages)
            .pipe(nunjucksRender({
                path: [config.templates],
                ext: fileExt,
                envOptions: {
                    noCache: false,
                    tags: {
                        blockStart: '<%',
                        blockEnd: '%>',
                        variableStart: '<$',
                        variableEnd: '$>',
                        commentStart: '<#',
                        commentEnd: '#>'
                    }
                },
            }))
            .on('error', notify.onError(function(error) {
                return 'An error occurred while compiling files.\nLook in the console for details.\n' + error;
            }))
            .pipe(htmlbeautify({
                indentSize: 2,
                indent_with_tabs: true,
                preserve_newlines: false
            }))
            .pipe(gulp.dest(dist.pages))
            .pipe(browserSync.stream({ once: true }))
    });

    // Save for web in PS first!
    gulp.task('images', function() {
        return gulp.src(src.img)
            .pipe(imagemin({
                optimizationLevel: 7,
                progressive: true,
                interlaced: true
            }))
            .pipe(gulpPngquant({
                quality: '65-80'
            }))
            .pipe(gulp.dest(dist.img))
            .pipe(browserSync.stream({ once: true }))
    });

    gulp.task('svgs', function() {
        return gulp.src(src.svg)
            .pipe(svgmin())
            .pipe(gulp.dest(dist.svg))
            .pipe(browserSync.stream({ once: true }))
    });

    gulp.task('fonts', function() {
        return gulp.src(src.fonts)
            .pipe(fontmin())
            .pipe(gulp.dest(dist.fonts))
            .pipe(browserSync.stream({ once: true }))
    });

    gulp.task('docs', function() {
        return gulp.src(src.docs)
            .pipe(gulp.dest(dist.docs))
            .pipe(browserSync.stream({ once: true }))
    });

    gulp.task('favicons', function() {
        return gulp.src(src.favicons)
            .pipe(gulp.dest(dist.favicons))
            .pipe(browserSync.stream({ once: true }))
    });


    // $ build - Runs all the required tasks (in order), launches browser sync, and watch for changes
    gulp.task('default', function() {
        runSequence(['nunjucks', 'scss', 'scripts'], ['images', 'svgs', 'fonts', 'docs', 'favicons'], ['browser-sync'], function() {
            gulp.watch(src.pages, ['nunjucks']);
            gulp.watch(src.templates, ['nunjucks']);
            gulp.watch(config.pagesWatch);
            gulp.watch(src.scss, ['scss']);
            gulp.watch(src.js, ['scripts']);
            gulp.watch(src.img, ['images']);
            gulp.watch(src.svg, ['svgs']);
            gulp.watch(src.fonts, ['fonts']);
            gulp.watch(src.favicons, ['favicons']);
            gulp.watch(src.docs, ['docs']);
        });
    });

}());
