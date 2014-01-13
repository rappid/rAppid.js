[![Build Status](https://travis-ci.org/rappid/rAppid.js.png?branch=dev)](https://travis-ci.org/rappid/rAppid.js)
[![Selenium Test Status](https://saucelabs.com/buildstatus/rappidjs)](https://saucelabs.com/u/rappidjs)
[![NPM version](https://badge.fury.io/js/rAppid.js.png)](http://badge.fury.io/js/rAppid.js)
[![Dependency Status](https://david-dm.org/rappid/rAppid.js.png)](https://david-dm.org/rappid/rAppid.js)
[![devDependency Status](https://david-dm.org/rappid/rAppid.js/dev-status.png)](https://david-dm.org/rappid/rAppid.js#info=devDependencies)


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

### Client side

* Dependency loading (via requirejs)
* XAML - Use custom components and HTML5 side-by-side
* Code-Behind - keep your application logic in a separate javascript file
* Model-View Binding, Two-Way Binding, Function Binding
* Dependency Injection
* Virtual / Computed Attributes
* Active Record Pattern for Models
* Single Instance Model Stores
* Abstract data access layer
* customizable Data sources with Processors and Format Processors
    * RestDataSource
    * LocalStorageDataSource
    * MongoDataSource *available on the server*
* i18n
* Router, History, ModuleLoader
* MessageBus
* WindowManager, Windows & Dialogs
* expandable Validation System
* supports optimizing & minifying
* Command-Line Interface

### Server side

The rAppid.js server is a modular architecture web server based on nodejs.

* Multiple EndPoints (http, https, spdy)
* Request Pipeline
* RequestHandler
    * StaticFile - delivers static files
    * REST - simply provide an REST API
    * NodeRendering - makes your RIA readable for search engines
* Authentication & Authorization System
* Session support

## How to contribute?

After cloning the repository, run `npm install` to install all dependencies.

### How to run tests?

There are three types of tests

All tests that can be run browser independently are started with

    mocha -R spec

Webtests that used to run in the browser are run on the *sauce labs* cloud
server. You need to make an account on https://saucelabs.com to run these
tests.

    grunt webtest-saucelabs --force

To test the server component of the framework, run

    grunt server-tests"

If you have any trouble regarding contribution, feel free to drop us a line.

## Need help?

If you have any problems with the framework feel free to contact us (support@rappidjs.com).
Follow [@rappidjs](https://twitter.com/rappidjs) on twitter to keep up with the latest news.
