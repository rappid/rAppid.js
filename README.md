# rAppid.js - the way you want to do it.
## Introduction

rAppid.js is a declarative JavaScript web application for rapid web application development. It uses XML to define the structure of applications, modules, components and views and JavaScript for the business logic of the application. The XML (xaml) gets translated to javascript components during runtime which will render itself as HTML5 DOM elements. This enables a rapid development of applications.

## Development

rAppid.js is currently under rapid development. The core features and life cycles are defined, but might be modified.
For more information and documentation of <rAppid.js /> lookup the [wiki](https://github.com/it-ony/rAppid.js/wiki).

An easy todo application written with rAppid.js can be found under [http://todo.rappidjs.com](http://todo.rappidjs.com).
For a demo of bindings and controls visit [http://demo.rappidjs.com/src/ui.html](http://demo.rappidjs.com/src/ui.html).



## Features 
* Dependency loading (via requirejs)
* Combination of XAML-Components and HTML5
* Code behind XML
* Model-View Binding
* Two-Way Binding
* Dependency Injection
* Inline JavaScript usage in XAML
* Virtual / Computed Attributes
* Active Record Pattern for Models
* Single Instance Model Stores
* Datasources with Processors (RestDataSource + JSON Processor, XMLProcessor in future)
* Abstract data access layer, which will later supports MongoDb
* i18n

## Installation
The installation of rAppid.js is simple done via [npm](http://npmjs.org/).

```
npm install rAppid.js -d -g
```

## Command-line interface
rAppid.js comes with a command-line interface to setup projects, install packages and updated modules.
Open a terminal and type 

```
rappidjs
```

to see the available commands. Type 

```
rappidjs help <command> 
```

to see the usage of the command.


For a guided creation of an application or library project execute
```
rappidjs interactive
```

## Setup an rAppid.js application project 
```
rappidjs create app <ApplicationName> [<TargetDirectory>]
```

The ```create``` command will setup the directory structure and install the required modules, so that you can concentrate on developing application. Under the target directory there will be an directory named ```public```. Open the ```index.html``` file in your Browser or even better configurate the public directory as website root in your preferred web-server.

*Note: If you want to test your application without configuring a web-server in a Google Chrome Browser, you have to start Chrome with the follwing parameters ```--disable-web-security```*
