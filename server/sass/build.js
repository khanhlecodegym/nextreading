/**
 * Copy right: https://gohugo-amp.gohugohq.com/styling/
 */
const sass = require('node-sass'),
      postcss = require('postcss'),
      fs = require('fs'),
      // abs path from root instead
      inputFile = './sass/main.scss',
      outputFile = './static/styles.css',
      inputEditor = './sass/editor.scss',
      outputEditor = './static/editor.css',
      inputFileUser = './sass/user.scss',
      outputFileUser = './static/user.css';

sass.render({
  file: inputFile,
  outputStyle: 'compressed'
}, (error, result) => {
  if (error) {
    console.log(error.status);
    console.log(error.column);
    console.log(error.message);
    console.log(error.line);
  } else {
    let cssOutput = result.css.toString();

    postcss([ require('autoprefixer'), require('cssnano') ])
      .process(cssOutput)
      .then((result) => {
        fs.writeFile(outputFile, result.css, err => {
          if (err) {
            return console.log(err);
          }
          console.log('\u2611 file '+outputFile+' updated with current styling from '+ inputFile);
        });
      });
  }
});

sass.render({
  file: inputEditor,
  outputStyle: 'compressed'
}, (error, result) => {
  if (error) {
    console.log(error.status);
    console.log(error.column);
    console.log(error.message);
    console.log(error.line);
  } else {
    let cssOutput = result.css.toString();

    postcss([ require('autoprefixer'), require('cssnano') ])
      .process(cssOutput)
      .then((result) => {
        fs.writeFile(outputEditor, result.css, err => {
          if (err) {
            return console.log(err);
          }
          console.log('\u2611 file '+outputEditor+' updated with current styling from '+ inputEditor);
        });
      });
  }
});

sass.render({
  file: inputFileUser,
  outputStyle: 'compressed'
}, (error, result) => {
  if (error) {
    console.log(error.status);
    console.log(error.column);
    console.log(error.message);
    console.log(error.line);
  } else {
    let cssOutput = result.css.toString();

    postcss([ require('autoprefixer'), require('cssnano') ])
      .process(cssOutput)
      .then((result) => {
        fs.writeFile(outputFileUser, result.css, err => {
          if (err) {
            return console.log(err);
          }
          console.log('\u2611 file '+outputFileUser+' updated with current styling from '+ inputFileUser);
        });
      });
  }
});
