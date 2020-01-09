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
gulp.task('lint:js', () =>
  gulp.src(['./src/**/*.js', './index.js']).pipe(eslint())
);
gulp.task('clean:js', () => del(['./dist/js']));
gulp.task(
  'js',
  gulp.series(gulp.parallel('clean:js', 'lint:js'), () => compileJS())
);
gulp.task('js:watch', () => compileJS(true));

//
// Styles
//
gulp.task('lint:sass', () =>
  gulp.src('./assets/scss/**/*.scss').pipe(
    stylelint({
      reporters: [{ formatter: 'string', console: true }],
    })
  )
);

gulp.task(
  'css',
  gulp.series('lint:sass', () =>
    gulp
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
      .pipe(gulp.dest('./dist/css'))
  )
);

gulp.task('css:clean', () => del(['./dist/css']));

gulp.task('css:watch', () => {
  gulp.watch('./assets/scss/**/*.scss', gulp.series('css'));
});

//
// Fonts
//
gulp.task('fonts:clean', () => del(['./dist/fonts']));

gulp.task(
  'fonts',
  gulp.series('fonts:clean', () =>
    gulp.src('./assets/fonts/**/*').pipe(gulp.dest('./dist/fonts'))
  )
);

gulp.task('fonts:watch', () => {
  gulp.watch('./assets/fonts/**/*', gulp.series('fonts'));
});

//
// Images
//
gulp.task('img:clean', () => del(['./dist/img']));

gulp.task(
  'img',
  gulp.series('img:clean', () =>
    gulp.src('./assets/img/**/*').pipe(gulp.dest('./dist/img'))
  )
);

gulp.task('img:watch', () => {
  gulp.watch('./assets/img/**/*', gulp.series('img'));
});

//
// Task sets
//
gulp.task('default', gulp.parallel('fonts', 'css', 'js', 'img'));
gulp.task('watch', gulp.parallel('css:watch', 'js:watch', 'img:watch'));

//
// Utils
//
function compileJS(watch) {
  let bundler = browserify('./assets/js/theme.js', {
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
    return bundler
      .bundle()
      .on('error', function(err) {
        console.error(err.message);
        // this.emit('end');
      })
      .pipe(source('theme.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist/js'));
  }

  return rebundle();
}

//
// Fractal
//
const fractal = (module.exports = require('@frctl/fractal').create());

fractal.set('project.title', 'Fractal Theme Test');
fractal.set('project.author', 'Andrew Leedham');
fractal.docs.set('path', `${__dirname}/test/docs`); // location of the documentation directory.
fractal.components.set('path', `${__dirname}/test/components`); // location of the component directory.

const xeroxTheme = require('./')();

fractal.web.theme(xeroxTheme);

const logger = fractal.cli.console;

gulp.task(
  'fractal:start',
  gulp.series(
    'default',
    gulp.parallel('watch', function() {
      const server = fractal.web.server({
        sync: true,
      });
      server.on('error', (err) => logger.error(err.message));
      return server.start().then(() => {
        logger.success(`Fractal server is now running at ${server.url}`);
      });
    })
  )
);
