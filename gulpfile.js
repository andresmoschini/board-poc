var gulp = require('gulp');
var tslint = require('gulp-tslint');
var exec = require('child_process').exec;
var gulp = require('gulp-help')(gulp);
var tsconfig = require('gulp-tsconfig-files');
var path = require('path');
var inject = require('gulp-inject');
var gulpSequence = require('gulp-sequence');
var rename = require('gulp-rename');
var del = require('del');

gulp.task('clean', 'Cleans the generated js files from lib directory', function () {
  return del([
    'client/lib/**/*'
  ]);
});

gulp.task('tslint', 'Lints all TypeScript source files', function () {
  return gulp.src('src/**/*.ts')
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('_build', 'INTERNAL TASK - Compiles all TypeScript source files', function (cb) {
  exec('browserify src/main.ts --debug -p [ tsify --noImplicitAny ] -o client/lib/scripts.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('build', 'Compiles all TypeScript source files and updates module references', 
  gulpSequence('tslint', '_build'));
