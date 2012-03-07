# rAppid.js - the way you want to do it.
## Introduction

rAppid.js is a declarative JavaScript web application for rapid web application development. It uses XML to define the structure of applications, modules, components and views and JavaScript for the business logic of the application. The XML (xaml) gets translated to javascript components during runtime which will render itself as HTML5 DOM elements. This enables a rapid development of applications.

## Development

rAppid.js is currently in an early state, defining the component life cycle and other core technics like model bindings, component rendering. Some parts of the interface of rAppid.js are changing until all methods, life-cycles, components are clearly defined and universal re-usable. 

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
