[![Build Status](https://travis-ci.org/it-ony/rAppid.js.png?branch=dev)](https://travis-ci.org/it-ony/rAppid.js)
[![Selenium Test Status](https://saucelabs.com/buildstatus/rappidjs)](https://saucelabs.com/u/rappidjs)

# rAppid.js - the declarative Rich Internet Application Javascript MVC Framework
## Introduction

rAppid.js is a declarative javascript web application framework for rapid web application development. It allows you to use XML to define the structure of the application and to configure components like datasources or routes. The XML (XAML) gets translated to javascript components during runtime which will render itself as HTML5 DOM elements. This enables a rapid development of application.

Designed first as a pure client side javascript library rAppid.js now includes an expendable web server with a request pipeline and different request handlers.

Visit http://www.rappidjs.com for quick start and documentation.

## Start using it in 3 steps

Install it using [npm](https://npmjs.org/).

```
sudo npm install -g rAppid.js
```

Create a new project with the new `rappidjs` command

```
rappidjs create app MyProject /my/project/directory
```

Start the build in web server
```
cd /my/project/directory
rappidjs server .
```

Then open http://localhost in your web browser.
Stop the server by pressing `Ctrl + C` in your terminal and start reading our [documentation](http://wiki.rappidjs.com).


## Features 
* Dependency loading (via requirejs)
* Combination of XAML-Components and HTML5
* Code behind + XML
* Model-View Binding, Two-Way Binding, Function Binding
* Dependency Injection
* Inline JavaScript usage in XAML
* Virtual / Computed Attributes
* Active Record Pattern for Models
* Single Instance Model Stores
* Abstract data access layer
* Datasources with Processors and Format Processors (RestDataSource, LocalStorageDataSource, ...)
* i18n
* Server side rendering with rAppid.js-server for SEO
* optimize build

## Need help?

If you have any problems with the framework feel free to contact us (support@rappidjs.com).
Follow [@rappidjs](https://twitter.com/rappidjs) on twitter to keep up with the latest news.

