var gulp = require('gulp');
var sass = require('gulp-sass')(require('node-sass'));

var pug = require('gulp-pug');
var webserver = require('gulp-webserver');
var minify = require("gulp-minify");

const fields = [
  {
    name: 'medicaid_only',
    label: 'With Medicaid Coverage Only',
    weight: 'population',
    color: '#0000ff',
    bgMax: 5864,
    countyMax: 2197187,
    stateMax: 7702598
  },
  {
    name: 'medicaid',
    label: 'With Medicaid Coverage',
    weight: 'population',
    color: '#0000ff',
    bgMax: 5926,
    countyMax: 2587154,
    stateMax: 8898799
  },
  {
    name: 'medicare_only',
    label: 'With Medicare Coverage Only',
    weight: 'population',
    color: '#0000ff',
    bgMax: 4032,
    countyMax: 577448,
    stateMax: 2174423
  },
  {
    name: 'medicare',
    label: 'With Medicare Coverage',
    weight: 'population',
    color: '#0000ff',
    bgMax: 6969,
    countyMax: 1321644,
    stateMax: 5223958
  },
  // {
  //   name: 'households',
  //   label: 'Households',
  //   bgMax: 7605,
  //   countyMax: 3390254,
  //   stateMax: 13434847,
  //   color: '#d35400'
  // },
  {
    name: 'snap_households',
    label: 'Households on Food Stamps/SNAP',
    bgMax: 1125,
    countyMax: 441054,
    stateMax: 1526052,
    weight: 'households',
    color: '#d35400'
  },
  // {
  //   name: 'population',
  //   label: 'Population',
  //   bgMax: 40481,
  //   countyMax: 9848406,
  //   stateMax: 39242785,
  //   weight: 'population',
  //   color: '#d35400'
  // },
  {
    name: 'white',
    label: 'White',
    bgMax: 18624,
    countyMax: 2477324,
    stateMax: 13573226,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'black',
    label: 'Black',
    bgMax: 6135,
    countyMax: 1148288,
    stateMax: 3528533,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'aian',
    label: 'Alaska Native/American Indian',
    bgMax: 5431,
    countyMax: 60061,
    stateMax: 271284,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'asian',
    label: 'Asian',
    bgMax: 7548,
    countyMax: 1458413,
    stateMax: 5906995,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'nhpi',
    label: 'Native Hawaiian/Pacific Islander',
    bgMax: 1676,
    countyMax: 93615,
    stateMax: 140064,
    weight: 'population',
    color: '#5a228b'
  },
  {
    name: 'hispanic',
    label: 'Hispanic',
    bgMax: 13887,
    countyMax: 4753369,
    stateMax: 15630830,
    weight: 'population',
    color: '#5a228b'
  },
  
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
