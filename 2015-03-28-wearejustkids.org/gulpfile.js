var fs = require("fs");
var del = require("del");
var gulp = require("gulp");
var merge = require("merge-stream");
var $ = require("gulp-load-plugins")();
var runSequence = require("run-sequence");
var browserSync = require("browser-sync");
var reload = browserSync.reload;


// helper functions
var handleErrors = function() {
    var args = Array.prototype.slice.call( arguments );

    $.notify.onError({
        title: "Compile Error",
        message: "<%= error.message %>"
    }).apply(this, args);

    this.emit("end");
};


gulp.task("styles", function() {
    return gulp.src("assets/styles/**/*.scss")
        //.pipe($.sourcemaps.init())
        .pipe($.sass({
            style: "expanded",
            onError: function( error ){
                $.notify().write( error );
            }
        }))
        //.pipe($.sourcemaps.write())
        .pipe($.autoprefixer( "last 2 versions" ))
        .pipe(gulp.dest( "dev/assets/styles" ))
        .pipe($.csso())
        .pipe(gulp.dest( "dist/assets/styles" ));
});


gulp.task("scripts", function() {
    var assets = $.useref.assets({
         searchPath: "/"
    });

    return gulp.src( "index.html" )
        .pipe( assets )
        .pipe($.uglify())
        .pipe(gulp.dest( "public" ));
});


gulp.task("copy", function( callback ) {
    var images = gulp.src( "assets/images/**/*" )
        .pipe( gulp.dest( "dev/assets/images" ) )
        .pipe( gulp.dest( "dist/assets/images" ) );

    var fonts = gulp.src( "assets/fonts/**/*" )
        .pipe(gulp.dest( "dev/assets/fonts" ))
        .pipe(gulp.dest( "dist/assets/fonts" ));

    var scripts = gulp.src( "assets/scripts/**/*" )
        .pipe(gulp.dest( "dev/assets/scripts" ))
        .pipe(gulp.dest( "dist/assets/scripts" ));

    var html = gulp.src( ["index.html", "contact-congress.js"] )
        .pipe(gulp.dest( "dev" ))
        .pipe(gulp.dest( "dist" ));

    return merge( images, fonts, scripts, html );
});


gulp.task("browsersync", function () {
    browserSync.init(null, {
        open: true,
        notify: false,
        logLevel: "debug",
        tunnel: { authtoken: "Fv+23hIClz16UDPOo7YE", subdomain: "wearejustkids" },
        injectChanges: true,
        files: "dev/assets/styles/screen.css",
        server: {
            baseDir: "dev"
        }
    });
});


// clean output directory
gulp.task("clean", function( callback ) {
    del( [ "dev", "dist" ], callback );
});


gulp.task("watch", function() {
    gulp.watch([
        "dev/images/**/*",
        "dev/scripts/**/*",
    ], reload);

    gulp.watch( ["index.html", "contact-congress.js"], ["copy"], reload );
    gulp.watch( "assets/styles/**/*.scss", ["styles"] );
    gulp.watch( "assets/scripts/**/*.js", ["scripts"], reload );
    gulp.watch( "assets/images/**", ["copy"] );
});


gulp.task("default", function (cb) {
    runSequence("clean", ["styles", "scripts", "copy"], ["watch", "browsersync"], cb);
});
