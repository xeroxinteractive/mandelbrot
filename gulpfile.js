'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const prettier = require('gulp-prettier');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const sassGlob = require('gulp-sass-glob');
const stylelint = require('gulp-stylelint');
const uglify = require('gulp-uglify');
const browserify = require('browserify');
const watchify = require('watchify');
const babel = require('babelify');
const eslintify = require('eslintify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const del = require('del');

//
// JS
//
gulp.task('lint:js', function() {
  return gulp.src(['./src/**/*.js', './index.js']).pipe(eslint());
});
gulp.task('js', ['clean:js', 'lint:js'], () => compileJS());
gulp.task('js:watch', () => compileJS(true));

gulp.task('clean:js', function() {
  return del(['./dist/js']);
});

//
// Styles
//
gulp.task('lint:sass', function() {
  return gulp.src('./assets/scss/**/*.scss').pipe(
    stylelint({
      reporters: [{ formatter: 'string', console: true }],
    })
  );
});

gulp.task('css', ['lint:sass'], function() {
  return gulp
    .src('./assets/scss/theme.scss')

    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(
      sass({
        includePaths: 'node_modules',
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: ['last 5 versions'],
      })
    )
    .pipe(prettier())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('css:clean', function() {
  return del(['./dist/css']);
});

gulp.task('css:watch', function() {
  gulp.watch('./assets/scss/**/*.scss', ['css']);
});

//
// Fonts
//
gulp.task('fonts', ['fonts:clean'], function() {
  gulp.src('./assets/fonts/**/*').pipe(gulp.dest('./dist/fonts'));
});

gulp.task('fonts:clean', function() {
  return del(['./dist/fonts']);
});

gulp.task('fonts:watch', function() {
  gulp.watch('./assets/fonts/**/*', ['fonts']);
});

//
// Images
//
gulp.task('img', ['img:clean'], function() {
  gulp.src('./assets/img/**/*').pipe(gulp.dest('./dist/img'));
  gulp.src('./assets/favicon.ico').pipe(gulp.dest('./dist'));
});

gulp.task('img:clean', function() {
  return del(['./dist/img']);
});

gulp.task('img:watch', function() {
  gulp.watch('./assets/img/**/*', ['img']);
});

//
// Task sets
//
gulp.task('watch', ['css:watch', 'js:watch', 'img:watch']);

gulp.task('default', ['fonts', 'css', 'js', 'img']);

//
// Utils
//
function compileJS(watch) {
  let bundler = browserify('./assets/js/mandelbrot.js', {
    debug: true,
  })
    .transform(eslintify)
    .transform(babel, {
      presets: ['es2015'],
    });

  if (watch) {
    bundler = watchify(bundler);
    bundler.on('update', function() {
      console.log('Rebundling JS....');
      rebundle();
    });
  }

  function rebundle() {
    const bundle = bundler
      .bundle()
      .on('error', function(err) {
        console.error(err.message);
        // this.emit('end');
      })
      .pipe(source('mandelbrot.js'))
      .pipe(buffer());

    if (!watch) {
      bundle.pipe(uglify());
    }

    bundle
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/js'));

    return bundle;
  }

  rebundle();
}
