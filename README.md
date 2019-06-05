# CSS Preprocessors benchmark

This app compares compilation time of Stylus and SASS CSS preprocessors for most used preprocessor functions and exports results to TSV.

For adding new tests, add folder to `src/` directory.

For running single test only, prepend test folder name with underscore (_).

### Preprocessors benchmarked:
* SASS (LibSASS compiler)
* SASS (DartSASS compiler)
* Stylus

### Benchmarked features:
* Plain list of rules
* List of nested rules
* Global varialbes
* Local variables
* Imports
* Mixins
* String and selector interpolation
* Loops & conditions
