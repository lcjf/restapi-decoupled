# Gulp Barebones Boilerplate

This is a replica of [the original Gulp workflow](https://gitlab.home-trial.com/infrastructure/gulp-barebones-boilerplate), the difference being is that the **src** folder has been completely stripped down.

Everything else is exactly the same, apart from the removal of the Bourbon Neat framework.

The below line in gulpfile.js has changed **from**:

`includePaths: ['src/styles/*.scss'].concat(neat)`

**to**:

`includePaths: ['src/styles/*.scss']`

This can be added back in if required, as the package is still located in your package.json

## Set up info
Please refer to The [Gulp workflow set up and usage guide](https://gitlab.home-trial.com/infrastructure/lukestrap/wikis/home) for more information.