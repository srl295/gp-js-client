JavaScript Client for Globalization Pipeline on IBM Bluemix
===
<!--
/*	
 * Copyright IBM Corp. 2015
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 
 
 DON’T EDIT README.md <<<<<<<<<<<< <<<<<<<<<<<<<<<<<<<<<<< THIS MEANS YOU!
 
    Edit `template-README.md` and run `npm run docs`
 
-->

# What is this?

This is a JavaScript SDK for the
[Globalization Pipeline](https://www.ng.bluemix.net/docs/#services/Globalization/index.html#globalization)
Bluemix service. The Globalization Pipeline service makes it easy for you to provide your global customers
with Bluemix applications translated into the languages in which they work.

The SDK currently supports Node.js, and also provides some sample code showing
how to use the service from jQuery.

# jQuery Sample

There is an experimental sample showing use of the use in the `jquery-sample` directory.
See the [Readme](./jquery-sample/README.md) in that directory for more details.

# Node.js

The remainder of this document explains how to use the Globalization service
with the [Node.js](http://nodejs.org) client.

For a working Bluemix application sample,
see [g11n-pipeline-nodejs-hello](https://github.com/IBM-Bluemix/g11n-pipeline-nodejs-hello).

## Quickstart - Bluemix

Add `g11n-pipeline` to your project, as well as `cfenv`.

    npm install --save g11n-pipeline cfenv

Load the gaas client object as follows (using [cfenv](https://www.npmjs.com/package/cfenv) ).

    var appEnv = require('cfenv').getAppEnv();
    var gpClient = require('g11n-pipeline').getClient({
       appEnv: appEnv
    });

## Testing

See [TESTING.md](TESTING.md)

API convention
==

APIs take a callback and use this general pattern:

    gpClient.function( { /*params*/ } ,  function callback(err, ...))

* params: an object containing input parameters, if needed.
* `err`: if truthy, indicates an error has occured.
* `...`: other parameters (optional)

These APIs may be promisified easily using a library such as `Q`'s
[nfcall](http://documentup.com/kriskowal/q/#adapting-node):

    return Q.ninvoke(bundle, "delete", {});
    return Q.ninvoke(gpClient, "getBundleList", {});


All language identifiers are [IETF BCP47](http://tools.ietf.org/html/bcp47) codes.

API reference
===
<a name="module_g11n-pipeline"></a>
## g11n-pipeline
**Author:** Steven R. Loomis  

* [g11n-pipeline](#module_g11n-pipeline)
  * _static_
    * [.serviceRegex](#module_g11n-pipeline.serviceRegex)
  * _inner_
    * [~Client](#module_g11n-pipeline..Client)
      * [.ping](#module_g11n-pipeline..Client+ping)
      * [.apis()](#module_g11n-pipeline..Client+apis) ⇒ <code>Object</code>
      * [.ready(arg, cb)](#module_g11n-pipeline..Client+ready)
      * [.restCall(fn, restArg, cb)](#module_g11n-pipeline..Client+restCall)
      * [.getServiceInstance(opts)](#module_g11n-pipeline..Client+getServiceInstance) ⇒ <code>String</code>
      * [.getBundleList(opts, cb)](#module_g11n-pipeline..Client+getBundleList)
      * [.supportedTranslations(args, cb)](#module_g11n-pipeline..Client+supportedTranslations)
      * [.getServiceInfo(args, cb)](#module_g11n-pipeline..Client+getServiceInfo)
      * [.createUser(args, cb)](#module_g11n-pipeline..Client+createUser)
      * [.deleteUser(args, cb)](#module_g11n-pipeline..Client+deleteUser)
      * [.bundle(opts)](#module_g11n-pipeline..Client+bundle) ⇒ <code>Bundle</code>
    * [~Bundle](#module_g11n-pipeline..Bundle)
      * [new Bundle(gp, props)](#new_module_g11n-pipeline..Bundle_new)
      * [.getInfoFields](#module_g11n-pipeline..Bundle+getInfoFields)
      * [.delete(opts, cb)](#module_g11n-pipeline..Bundle+delete)
      * [.create(body, cb)](#module_g11n-pipeline..Bundle+create)
      * [.getInfo(opts, cb)](#module_g11n-pipeline..Bundle+getInfo)
      * [.uploadResourceStrings(opts, cb)](#module_g11n-pipeline..Bundle+uploadResourceStrings)

<a name="module_g11n-pipeline.serviceRegex"></a>
### g11n-pipeline.serviceRegex
a Regex for matching the service.
Usage: var credentials = require('cfEnv')
     .getAppEnv().getServiceCreds(gp.serviceRegex);

**Kind**: static property of <code>[g11n-pipeline](#module_g11n-pipeline)</code>  
**Properties**

| Name |
| --- |
| gp.serviceRegex | 

<a name="module_g11n-pipeline..Client"></a>
### g11n-pipeline~Client
**Kind**: inner class of <code>[g11n-pipeline](#module_g11n-pipeline)</code>  

  * [~Client](#module_g11n-pipeline..Client)
    * [.ping](#module_g11n-pipeline..Client+ping)
    * [.apis()](#module_g11n-pipeline..Client+apis) ⇒ <code>Object</code>
    * [.ready(arg, cb)](#module_g11n-pipeline..Client+ready)
    * [.restCall(fn, restArg, cb)](#module_g11n-pipeline..Client+restCall)
    * [.getServiceInstance(opts)](#module_g11n-pipeline..Client+getServiceInstance) ⇒ <code>String</code>
    * [.getBundleList(opts, cb)](#module_g11n-pipeline..Client+getBundleList)
    * [.supportedTranslations(args, cb)](#module_g11n-pipeline..Client+supportedTranslations)
    * [.getServiceInfo(args, cb)](#module_g11n-pipeline..Client+getServiceInfo)
    * [.createUser(args, cb)](#module_g11n-pipeline..Client+createUser)
    * [.deleteUser(args, cb)](#module_g11n-pipeline..Client+deleteUser)
    * [.bundle(opts)](#module_g11n-pipeline..Client+bundle) ⇒ <code>Bundle</code>

<a name="module_g11n-pipeline..Client+ping"></a>
#### client.ping
Do we have access to the server?

**Kind**: instance property of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | (ignored) |
| cb | <code>callback</code> |  |

<a name="module_g11n-pipeline..Client+apis"></a>
#### client.apis() ⇒ <code>Object</code>
Get the REST APIs. Use with ready()

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  
**Returns**: <code>Object</code> - - Map of API operations, otherwise null if not ready.  
<a name="module_g11n-pipeline..Client+ready"></a>
#### client.ready(arg, cb)
Verify that the client is ready before proceeding.

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| arg | <code>Object</code> | arg option, passed to cb on success or failure |
| cb | <code>function</code> | callback (called with (null, arg, apis) on success |

<a name="module_g11n-pipeline..Client+restCall"></a>
#### client.restCall(fn, restArg, cb)
Call a REST function. Verify the results.
cb is called with the same context.

This is designed for internal implementation.

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>Array</code> | function name, such as ["admin","getServiceInfo"] |
| restArg | <code>Object</code> | args to the REST call |
| cb | <code>function</code> |  |

<a name="module_g11n-pipeline..Client+getServiceInstance"></a>
#### client.getServiceInstance(opts) ⇒ <code>String</code>
Get the serviceInstance id from a parameter or from the 
client's default.

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  
**Returns**: <code>String</code> - - the service instance ID if found  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | can be a map, or falsy. |
| opts.serviceInstance | <code>String</code> | the service instance |

<a name="module_g11n-pipeline..Client+getBundleList"></a>
#### client.getBundleList(opts, cb)
Get a list of the bundles

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> |  |
| opts.serviceInstance | <code>String</code> | optional service instance |
| cb | <code>basicCallback</code> | callback. |

<a name="module_g11n-pipeline..Client+supportedTranslations"></a>
#### client.supportedTranslations(args, cb)
This function returns a map from source language(s) to target language(s).

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type |
| --- | --- |
| args | <code>object</code> | 
| cb | <code>supportedTranslationsCallback</code> | 

<a name="module_g11n-pipeline..Client+getServiceInfo"></a>
#### client.getServiceInfo(args, cb)
Get information about this service

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type |
| --- | --- |
| args | <code>object</code> | 
| cb | <code>basicCallback</code> | 

<a name="module_g11n-pipeline..Client+createUser"></a>
#### client.createUser(args, cb)
Create a user

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | TBD |
| cb | <code>callback</code> |  |

<a name="module_g11n-pipeline..Client+deleteUser"></a>
#### client.deleteUser(args, cb)
Delete a user

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>object</code> | TBD |
| cb | <code>callback</code> |  |

<a name="module_g11n-pipeline..Client+bundle"></a>
#### client.bundle(opts) ⇒ <code>Bundle</code>
Create a bundle access object.
This doesn’t create the bundle itself, just a lightweight
accessor object.

**Kind**: instance method of <code>[Client](#module_g11n-pipeline..Client)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | String (id) or map {id: bundleId, serviceInstance: serviceInstanceId} |

<a name="module_g11n-pipeline..Bundle"></a>
### g11n-pipeline~Bundle
**Kind**: inner class of <code>[g11n-pipeline](#module_g11n-pipeline)</code>  

  * [~Bundle](#module_g11n-pipeline..Bundle)
    * [new Bundle(gp, props)](#new_module_g11n-pipeline..Bundle_new)
    * [.getInfoFields](#module_g11n-pipeline..Bundle+getInfoFields)
    * [.delete(opts, cb)](#module_g11n-pipeline..Bundle+delete)
    * [.create(body, cb)](#module_g11n-pipeline..Bundle+create)
    * [.getInfo(opts, cb)](#module_g11n-pipeline..Bundle+getInfo)
    * [.uploadResourceStrings(opts, cb)](#module_g11n-pipeline..Bundle+uploadResourceStrings)

<a name="new_module_g11n-pipeline..Bundle_new"></a>
#### new Bundle(gp, props)

| Param | Type | Description |
| --- | --- | --- |
| gp | <code>Client</code> | parent g11n-pipeline client object |
| props | <code>Object</code> | properties to inherit |

<a name="module_g11n-pipeline..Bundle+getInfoFields"></a>
#### bundle.getInfoFields
List of fields usable with Bundle.getInfo()

**Kind**: instance property of <code>[Bundle](#module_g11n-pipeline..Bundle)</code>  
<a name="module_g11n-pipeline..Bundle+delete"></a>
#### bundle.delete(opts, cb)
Delete this bundle.

**Kind**: instance method of <code>[Bundle](#module_g11n-pipeline..Bundle)</code>  

| Param | Type |
| --- | --- |
| opts | <code>Object</code> | 
| cb | <code>basicCallback</code> | 

<a name="module_g11n-pipeline..Bundle+create"></a>
#### bundle.create(body, cb)
**Kind**: instance method of <code>[Bundle](#module_g11n-pipeline..Bundle)</code>  

| Param | Type | Description |
| --- | --- | --- |
| body | <code>Object</code> | see API docs |
| cb | <code>basicCallback</code> |  |

<a name="module_g11n-pipeline..Bundle+getInfo"></a>
#### bundle.getInfo(opts, cb)
Get bundle info

**Kind**: instance method of <code>[Bundle](#module_g11n-pipeline..Bundle)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | Options object |
| opts.fields | <code>String</code> | Comma separated list of fields |
| opts.translationStatusMetricsByLanguage | <code>Boolean</code> | Optional field (false by default) |
| opts.reviewStatusMetricsByLanguage | <code>Boolean</code> | Optional field (false by default) |
| opts.partnerStatusMetricsByLanguage | <code>Boolean</code> | Optional field (false by default) |
| cb | <code>basicCallback</code> |  |

<a name="module_g11n-pipeline..Bundle+uploadResourceStrings"></a>
#### bundle.uploadResourceStrings(opts, cb)
Upload some resource strings

**Kind**: instance method of <code>[Bundle](#module_g11n-pipeline..Bundle)</code>  

| Param | Type | Description |
| --- | --- | --- |
| opts | <code>Object</code> | options |
| opts.languageId | <code>String</code> | language to update |
| opts.strings | <code>Object</code> | strings to update |
| cb | <code>basicCallback</code> |  |


*docs autogenerated via [jsdoc2md](https://github.com/jsdoc2md/jsdoc-to-markdown)*


Support
===
You can post questions about using this service in the developerWorks Answers site
using the tag "[globalization-pipeline](https://developer.ibm.com/answers/topics/globalization-pipeline
/)".

LICENSE
===
Apache 2.0. See [LICENSE.txt](LICENSE.txt)
