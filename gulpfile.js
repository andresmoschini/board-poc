var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    exec = require('child_process').exec,
    gulp = require('gulp-help')(gulp),
    tsconfig = require('gulp-tsconfig-files'),
    path = require('path'),
    inject = require('gulp-inject'),
    gulpSequence = require('gulp-sequence'),
    rename = require('gulp-rename'),
    del = require('del'),
    jasmine = require('gulp-jasmine'),
    watch = require('gulp-watch');

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

gulp.task('_build_koclient', 'INTERNAL TASK - Compiles Knockout Client TypeScript source files', function (cb) {
  exec('browserify src/koclient/ko-main.ts --debug -p [ tsify --noImplicitAny ] -o client/lib/koclient.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('_build_server', 'INTERNAL TASK - Compiles Server TypeScript source files', function (cb) {
  exec('tsc --project src/server', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('build', 'Compiles all TypeScript source files and updates module references',
  gulpSequence('tslint', [ '_build_server', '_build_koclient' ]));

gulp.task('test', ["build-test"], function(){
  gulp.src("./test/test/**/*.js")
  .pipe(jasmine({
    verbose: true
  }));
});

gulp.task('build-test', "Compiling test files", function(cb){
  exec('tsc -p src/test', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('watch-test', ["test"], function(){
  gulp.watch("./src/**/*.ts", ["test"]);
});
