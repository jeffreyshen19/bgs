var gulp = require('gulp');
var sass = require('gulp-sass')(require('node-sass'));

var pug = require('gulp-pug');
var webserver = require('gulp-webserver');
var minify = require("gulp-minify");

const fields = [
  {
    name: 'medicarecaid_only',
    label: 'With Medicare/Medicaid Coverage Only',
    max: 5932,
    weight: 'population',
    color: '#0000ff'
  },
  {
    name: 'medicarecaid',
    label: 'With Medicare/Medicaid Coverage',
    max: 6969,
    weight: 'population',
    color: '#0000ff'
  },
  {
    name: 'snap_households',
    label: 'Households on Food Stamps/SNAP (in the past year)',
    max: 1125,
    weight: 'households',
    color: '#d35400'
  },
  {
    name: 'white',
    label: 'White (non-Hispanic)',
    max: 18624,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'black',
    label: 'Black (non-Hispanic)',
    max: 6135,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'hispanic',
    label: 'Hispanic',
    max: 13887,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'asian',
    label: 'Asian (non-Hispanic)',
    max: 7548,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'aian',
    label: 'Alaska Native/American Indian (non-Hispanic)',
    max: 5431,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'nhpi',
    label: 'Native Hawaiian/Pacific Islander (non-Hispanic)',
    max: 1676,
    weight: 'population',
    color: '#5a228b'
  }
  
]

gulp.task('views', function buildHTML() {
  return gulp.src('src/views/*.pug')
    .pipe(pug({
      locals: {
        fields: fields
      }
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('sass', function () {
  return gulp.src('src/SCSS/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(gulp.dest('dist/CSS'));
});

gulp.task('js', function () {
  return gulp.src("src/JS/*.js")
    .pipe(minify())
    .pipe(gulp.dest("dist/JS"));
});

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver({
      livereload: true,
      open: false
    }));
});

gulp.task('watch', function () {
  gulp.watch('src/SCSS/*.scss', gulp.series('sass'));
  gulp.watch('src/views/*.pug', gulp.series('views'));
  gulp.watch('src/JS/main.js', gulp.series('js'));
});

gulp.task('default', gulp.series('views', 'sass', 'js', gulp.parallel('watch', 'webserver')));
