/*	
 * Copyright IBM Corp. 2015-2016
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

// High Level test of GAAS API

// load locals
require('./lib/localsetenv').applyLocal();

//return true;

var Q = require('q');

var minispin = require('./lib/minispin');
var randHex = require('./lib/randhex');
var gaasTest = require ('./lib/gp-test');
var GaasHmac = require('../lib/gp-hmac');

if(process.env.NO_CLIENT_TEST) { describe = describe.skip;  }
var gaas = require('../index.js'); // required, below
var gaasClient;

var ourReaderKey; // to be filled in - API key.
var ourReaderClient; // to be filled in - separate client that's just a reader.

var expect = require('chai').expect;
var assert = require('assert');

var VERBOSE = process.env.GP_VERBOSE || false;
var NO_DELETE = process.env.NO_DELETE || false;
if(VERBOSE) console.dir(module.filename);

var projectId = process.env.GP_PROJECT  || 'MyHLProject'+Math.random();
var projectId2 = process.env.GP_PROJECT2 || 'MyOtherHLProject'+Math.random();
var projectId3 = process.env.GP_PROJECT3 || 'MyUserProject'+Math.random();

var DELAY_AVAIL = process.env.DELAY_AVAIL || false;

// Delay prefix (for QRU)
var DELAY = (DELAY_AVAIL)?"@DELAY@":"";

// MS to loop when waiting for things to happen.
var UNTIL_DELAY = 1024;

var sourceData = {
    "key1": DELAY+"First string to translate",
    "key2": "Second string to\n\"\\\'\ttranslate"
};
var str3 = 'The main pump fixing screws with the correct strength class';
var qruData = {
  key1: "Фирст стринг то транслате",
  key2: "Сецонд стринг то\n\"\\\'\tтранслате"
};

var opts = {
  credentials: gaasTest.getCredentials()
};

function resterr(o) {
  if(!o) {
    return Error("(falsy object)");
  }
  if(o.data && o.message) {
    return Error(o.data.message);
  } else if(o.message) {
    return Error(o.message);
  }
}
var urlEnv = gaas._normalizeUrl(opts.credentials.url); // use GaaS normalize
  
describe('Setting up GaaS test', function() {
  if ( urlEnv ) {
    var urlToPing = urlEnv+'/';
    if(VERBOSE) console.dir(urlToPing);
    it('should let us directly ping ' + urlToPing, function(done) {
      var timeout;
      var http_or_https = require('./lib/byscheme')(urlEnv);
      var t = 200;
      var loopy = function() {
          if(timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }
          minispin.step();
          try {
            http_or_https.get(urlToPing, // trailing slash to avoid 302
            function(d) {
               if(VERBOSE) console.log(urlToPing + '-> ' + d.statusCode); // dontcare
               if(d.statusCode === 200) {
                 minispin.clear();
                 done();
               } else {
                 timeout = setTimeout(loopy, t);
               }
            }).on('error', function(e) {
              if(VERBOSE) console.dir(e, {color: true});
               timeout = setTimeout(loopy, t);
            });
          } catch(e) {
              if(VERBOSE) console.dir(e, {color: true});
             timeout = setTimeout(loopy, t);
          }
      };
      process.nextTick(loopy); // first run
    });
    
    
    it('requiring gaas with options', function(done) {
      gaasClient = gaas.getClient(opts);
      //if(VERBOSE) console.log( gaasClient._getUrl() );
      done();
    });
  } else {
    // no creds
    it('should have had credentials',  function(done) {
      done('please create local-credentials.json or have GP_URL/GP_USER_ID/GP_PASSWORD/GP_INSTANCE set');
    });
  }
});

// ping
describe('Verifying again that we can reach the server', function() {
  it('Should let us call gaasClient.ping', function(done) {
      if(process.env.BAIL_ON_ERR && !gaasClient.hasOwnProperty('ping')) {
        console.error('Could not reach server');
        process.exit(1);
      }
    gaasClient.ping({}, function(err, data) {
      
      if(err && process.env.BAIL_ON_ERR) {
        console.error('Could not reach server');
        process.exit(1);
      }
      
      if(err) { done(err); return; }
      if(VERBOSE) console.dir(data);
      done();
    });
  });
});

describe('gaasClient.supportedTranslations()', function() {
  it('Should let us list translations', function(done) {
    gaasClient.supportedTranslations({}, function(err, translations) {
      if(err) { done(err); return; }
      if(VERBOSE) console.dir(translations);
      expect(translations).to.include.keys('en');
      expect(translations.en).to.include('de');
      expect(translations.en).to.include('es');
      done();
    });
  });
});

var randInstanceName = randHex()+'-'+randHex()
var instanceName = (opts.credentials.instanceId) // given
                    || randInstanceName;  // random


describe('gaasClient.setup instance ' + instanceName, function() {
  it('should’t let me call deprecated getBundleList() yet for ' + randInstanceName, function(done) {
    // ADMIN:  instance should not exist.
    try {
      gaasClient.getBundleList({serviceInstance: randInstanceName}, function(err, data) {
        if(err) {
          if(VERBOSE) console.dir(err);
          done();
        } else {
          done(Error('Expected failure here.'));
        }
      });
    } catch(e) {
      if(VERBOSE) console.dir(e);
      done(); // expect
    }
  });
  it('should’t let me call bundles() yet for ' + randInstanceName, function(done) {
    // ADMIN:  instance should not exist.
    try {
      gaasClient.bundles({serviceInstance: randInstanceName}, function(err, data) {
        if(err) {
          if(VERBOSE) console.dir(err);
          done();
        } else {
          done(Error('Expected failure here.'));
        }
      });
    } catch(e) {
      if(VERBOSE) console.dir(e);
      done(); // expect
    }
  });
  if(opts.credentials.isAdmin) it('should let us create our instance', function(done) {
    gaasClient.ready(done, function(err, done, apis) {
      if(err) { done(err); return; }
      apis.admin.createServiceInstance({
        serviceInstanceId: instanceName,
        body: {
          serviceId: 'rand-'+randHex(),
          orgId: 'rand-'+randHex(),
          spaceId: 'rand-'+randHex(),
          planId: 'rand-'+randHex(),
          disabled: false
        }
      }, function onSuccess(o) {
        if(o.obj.status !== 'SUCCESS') {
          done(Error(o.obj.status));
        } else {
          //console.dir(o.obj, {depth: null, color: true});
          done();
        }
      }, function onFailure(o) {
        done(resterr(o));
      });
    });
  });
  it('should now let me call deprecated getBundleList() (cb)', function(done) {
    gaasClient.getBundleList({serviceInstance: instanceName}, function(err, data) {
      if(err) {
        done(err);
      } else {
        if(opts.credentials.isAdmin) {
          expect(data.length).to.equal(0);
        } else {
          if(VERBOSE && data.length >0) {
            console.log('Note: You have pre existing instances. That’s probably ok, though best to run this test with a clean slate.');
          }
        }
        done();
      }
    });
  });
  it('should now let me call bundles() (cb)', function(done) {
    gaasClient.bundles({serviceInstance: instanceName}, function(err, data) {
      if(err) {
        done(err);
      } else {
        if(opts.credentials.isAdmin) {
          expect(data).to.be.ok;
          expect(data).to.eql({});
        } else {
          if(VERBOSE && data.length >0) {
            console.log('Note: You have pre existing instances. That’s probably ok, though best to run this test with a clean slate.');
          }
        }
        done();
      }
    });
  });
});

describe('gaasClient.bundle()', function() {
  it('Should let us create a bundle accessor', function(done) {
    var proj = gaasClient.bundle({id:'Something', serviceInstance: instanceName});
    expect(proj.id).to.equal('Something');
    done();
  });
  it('Should let us create a bundle accessor again', function(done) {
    var proj = gaasClient.bundle('Something');
    expect(proj.id).to.equal('Something');
    done();
  });
  it('Should fail if bundle does not exist', function(done) {
    var bundle = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    expect(bundle.sourceLanguage).to.not.be.ok;
    bundle.getInfo({}, function(err, bundle2) {
        if(err) return done();
        done('Expected error.');
    });
  });
  it('Should fail if resource does not exist', function(done) {
    var bundle = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    expect(bundle.sourceLanguage).to.not.be.ok;
    bundle.entry({languageId: 'tlh', resourceKey: 'key0'})
       .getInfo({}, function(err, entry2) {
        if(err) return done();
        done('Expected error.');
    });
  });
  it('Should let us create', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    Q.ninvoke(proj, "create", {sourceLanguage: 'en', targetLanguages: ['es','qru']})
    .then(function(resp) {
      done();
    }, done);
  });
  it('Should now be able to get info', function(done) {
    var bundle = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    expect(bundle.sourceLanguage).to.not.be.ok;
    bundle.getInfo({}, function(err, bundle2) {
        if(err) return done(err); // not ok
        expect(bundle2).to.be.ok;
        expect(bundle2.updatedBy).to.be.a('string');
        expect(bundle2.updatedAt).to.be.a('date');
        expect(bundle2.sourceLanguage).to.equal('en');
        done();
    });
  });
  it('should now let me call bundles() and see our bundle', function(done) {
    gaasClient.bundles({serviceInstance: instanceName}, function(err, list) {
        if(err) return done(err);
        expect(list).to.be.ok;
        expect(list).to.contain.keys(projectId);
        expect(list[projectId]).to.be.ok;
        expect(list[projectId].sourceLanguage).to.not.be.ok;
        // it's a bundle, call it
        list[projectId].getInfo({}, function(err, bundle2) {
            if(err) return done(err);
            expect(bundle2).to.be.ok;
            expect(bundle2.sourceLanguage).to.equal('en');
            return done();
        });
    });
  });
  it('Should let us upload some strings', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    proj.uploadStrings({
        languageId: 'en',
        strings: sourceData
    }, done);
  });
  if(DELAY_AVAIL) it('should let us verify the target entry(qru).key1 is in progress', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    proj.getEntryInfo({ languageId: 'qru', resourceKey: 'key1'},
    function(err, data) {
      if(err) {done(err); return; }
    //   console.dir(data);
    //   expect(data.language).to.equal('en');
      expect(data).to.have.a.property('resourceEntry');
      expect(data.resourceEntry).to.have.a.property('translationStatus');
      expect(data.resourceEntry.translationStatus).to.equal('IN_PROGRESS');
    //   expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(qruData));
      done();
    });
  });
  // In any event, wait until key2 has SUCCEEDED. if @DELAY@ is used this may take some time, otherwise could already be done.
  it('Should let us wait until key2 has TRANSLATED', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    var entry = proj.entry({ languageId: 'qru', resourceKey: 'key2'});
    var loopy = function() {
        minispin.step();
        entry.getInfo({},
            function(err, data) {
                if(err) {minispin.clear(); done(err); return; }
                if(VERBOSE) console.dir(data);
                if(data.translationStatus === 'IN_PROGRESS') {
                    setTimeout(loopy, 1024);
                } else {
                    expect(data.translationStatus).to.equal('TRANSLATED');
                    expect(data.value).to.equal(qruData.key2);
                    minispin.clear();
                    done();
                }
            });
    };
    process.nextTick(loopy);
  });
//   it('should let us verify the target entry(qru) is in progress', function(done) {
//     var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
//     proj.getEntryInfo({ languageId: 'qru', resourceKey: 'key1'},
//     function(err, data) {
//       if(err) {done(err); return; }
//       console.dir(data);
//     //   expect(data.language).to.equal('en');
//       expect(data).to.have.a.property('translationStatus');
//       expect(data.resourceEntry.translationStatus).to.equal('IN_PROGRESS');
//     //   expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(qruData));
//       done();
//     });
//   });
  it('should let us verify the target data(qru)', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    proj.getStrings({ languageId: 'qru'},
    function(err, data) {
      if(err) {done(err); return; }
    //   console.dir(data);
    //   expect(data.language).to.equal('en');
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(qruData));
      done();
    });
  });
  it('should let us verify some source entries', function(done) {
    var bund = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    var entry = bund.entry({languageId:'en',resourceKey:'key1'});
    expect(entry.resourceKey).to.equal('key1');
    expect(entry.languageId).to.equal('en');
    expect(entry.value).to.not.be.ok;
    entry.getInfo({}, function(err, entry2) {
        if(err) return(done(err));
        expect(entry2).to.be.ok;
        expect(entry2.resourceKey).to.equal(entry.resourceKey);
        expect(entry2.languageId).to.equal(entry.languageId);
        expect(entry2.value).to.be.ok;
        expect(entry2.value).to.equal(sourceData.key1);
        done();
    });
  });
  it('should let us verify some target entries', function(done) {
    var bund = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    var entry = bund.entry({languageId:'qru',resourceKey:'key1'});
    expect(entry.resourceKey).to.equal('key1');
    expect(entry.languageId).to.equal('qru');
    expect(entry.value).to.not.be.ok;
    entry.getInfo({}, function(err, entry2) {
        if(err) return(done(err));
        expect(entry2).to.be.ok;
        expect(entry2.resourceKey).to.equal(entry.resourceKey);
        expect(entry2.languageId).to.equal(entry.languageId);
        expect(entry2.updatedBy).to.be.a('string');
        expect(entry2.updatedAt).to.be.a('date');
        expect(entry2.value).to.be.ok;
        expect(entry2.value).to.equal(qruData.key1);
        done();
    });
  });
  it('should NOT us update the wrong language(tlh)', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    proj.uploadStrings({ languageId: 'tlh',
                              strings: sourceData},
    function(err){if(err){done(); return;} done(Error('should have failed')); });
  });
  it('should let us verify the source data(en)', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    proj.getStrings({ languageId: 'en'},
    function(err, data) {
      if(err) {done(err); return; }
    //   expect(data.language).to.equal('en');
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(sourceData));
      done();
    });
  });
  it('should now let me call old getBundleList  (promises!)', function(done) {
    Q.ninvoke(gaasClient, "getBundleList", {serviceInstance: instanceName})
    .then(function(data) {
        expect(data).to.contain(projectId);
        done();
    },done);
  });
  it('Should let me update the review status of a bundle', function(done) {
    var entry = gaasClient
                    .bundle({id:projectId, serviceInstance: instanceName})
                    .entry({languageId:'qru',resourceKey:'key1'});
    entry.update({
        reviewed: true
    }, function(err, data) {
        if(err) return done(err);
        
        entry.getInfo({},
        function(err, entry2) {
            if(err) return done(err);
            expect(entry2.reviewed).to.be.true;
            entry.update({
                reviewed: false
            }, function(err, data) {
                if(err) return done(err);
                expect(entry2.reviewed).to.be.true; // unchanged
                entry.getInfo({},
                function(err, entry3){ 
                    if(err) return done(err);
                    expect(entry3.reviewed).to.be.false;
                    done();
                });
            })
        });
    });
  });

  it('Should let us call client.users()', function (done) {
      gaasClient.users({ serviceInstance: instanceName }, function (err, users) {
          if (err) return done(err);
          expect(users).to.be.ok;
          done();
      });
  });

  var myUserInfo = undefined;  
  var readerInfo = undefined;
  var adminInfo  = undefined;
  var gaasReaderClient = undefined;
  var gaasAdminClient = undefined;
  it('should not let me create a bad user', function(done) {
    Q.ninvoke(gaasClient, "createUser", {serviceInstance: instanceName,
                           type:'SOME_BAD_TYPE',
                           bundles: ['*'],
                           displayName: 'Somebody'})
    .then(function(data) {
      done(Error('Should have failed.'));
    },function(err){done();});
  });
  it('should let me create an admin user', function(done) {
    Q.ninvoke(gaasClient, "createUser", {serviceInstance: instanceName,
                           type:'ADMINISTRATOR',
                           bundles: ['*'],
                           displayName: 'Somebody'})
    .then(function(data) {
      expect(data).to.be.ok;
      expect(data.user).to.be.ok;
      expect(data.id).to.be.ok;
      expect(data.user).to.be.ok;
      expect(data.user.id).to.be.ok;
      expect(data.user.password).to.be.ok;
      expect(data.user.displayName).to.equal('Somebody');
      if(VERBOSE || NO_DELETE) console.dir(data,{color:true});
      myUserInfo = {
        instanceId: instanceName,
        userId: data.user.id,
        password: data.user.password,
        url: opts.credentials.url
      };
      adminInfo = { credentials: myUserInfo };
      done();
    },done);
  });
  it('should let me create a reader user', function(done) {
    Q.ninvoke(gaasClient, "createUser", {serviceInstance: instanceName,
                           type:'READER',
                           bundles: [projectId3],
                           displayName: 'Reador'})
    .then(function(data) {
      expect(data).to.be.ok;
      expect(data.user).to.be.ok;
      expect(data.id).to.be.ok;
      expect(data.user).to.be.ok;
      expect(data.user.id).to.be.ok;
      expect(data.user.password).to.be.ok;
      expect(data.user.displayName).to.equal('Reador');
      // Dump sample config data.
      readerInfo = {
          credentials: {
            instanceId: instanceName,
            userId: data.user.id,
            password: data.user.password,
            url: opts.credentials.url
          },
          bundleId: projectId3
        };
      if(VERBOSE || NO_DELETE) console.dir({
        sampleconfig: readerInfo
      },{color:true});
      done();
    },done);
    it('Should let us call client.users()', function (done) {
        gaasClient.users({ serviceInstance: instanceName }, function (err, users) {
            if (err) return done(err);
            expect(users).to.be.ok('object');
            expect(users).to.contain.keys([myUserInfo.userId, readerInfo.credentials.userId]);
            done();
        });
    });
  });

  // Let's test that reader user
    
  it('Should verify the reader user can ping', function(done) {
    expect(myUserInfo).to.be.ok; // otherwise, user creation failed
    gaasReaderClient = gaas.getClient(readerInfo);
    gaasReaderClient.ping({}, done);
  });
  
  it('Should verify the admin user can ping', function(done) {
    expect(adminInfo).to.be.ok; // otherwise, user creation failed
    gaasAdminClient = gaas.getClient(adminInfo);
    gaasAdminClient.ping({}, done);
  });
  
  // Metadata test here.
 (describe.skip || describe) ('Metadata Test [broken, server side bugs]', function() {
        var kinds = {
            bundle: function () { 
                return gaasAdminClient
                    .bundle(projectId3); 
            },
            user: function () { 
                return gaasAdminClient
                    .user(readerInfo.credentials.userId); 
            },
            entry: function () { 
                return gaasAdminClient
                    .bundle(projectId3)
                    .entry({languageId:'en', resourceKey:'hello'}); 
            }
        };
        Object.keys(kinds).forEach(function(k) {
            describe('Metadata test over ' + k, function() {
                it('Should verify that the test object exists', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok;
                    done();
                });
                it('Should verify that the test object has clear metadata', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({});
                        done();
                    });
                });
                it('Should set k=v', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({metadata: {k:"v"}},done);
                });
                it('Should do noop update', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({},done);
                });
                it('Should verify that the test object has k=v', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({k:"v"});
                        done();
                    });
                });
                it('Should do noop update', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({},done);
                });
                it('Should verify that the test object still has k=v', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({k:"v"});
                        done();
                    });
                });
                it('Should set k2=v2,k3=v3', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({metadata: {k2:"v2",k3:"v3"}},done);
                });
                it('Should verify that the test object has k=v,k2=v2,k3=v3', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({k:"v",k2:"v2",k3:"v3"});
                        done();
                    });
                });
                it('Should set k2=v2x,k=null,k3=', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({metadata: {k2:"v2x",k:null,k3:""}},done);
                });
                it('Should verify that the test object has k2=v2x', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({k2:"v2x",k3:""});
                        done();
                    });
                });
                it('Should set null (clear metadata)', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.update({metadata: null},done); // clear
                });
                it('Should verify that the test object has clear metadata again', function(done) {
                    var t = kinds[k]();
                    expect(t).to.be.ok; // to avoid cascading failure
                    t.getInfo({}, function(err, t2) {
                        if(err) return done(err);
                        expect(t2).to.be.ok;
                        expect(t2.metadata).to.deep.equal({});
                        done();
                    });
                });
            });
        });
    });
        
  it('Should verify the reader user can NOT getInfo ' + projectId, function(done) {
    //  console.dir(readerInfo);
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .getInfo({}, function(err, bund) {
            expect(err).to.be.ok;
            done();
        });
  });
  
 it('should verify the reader user can NOT read the source data(en)', function(done) {
    var proj = gaasReaderClient.bundle(projectId);
    proj.getStrings({ languageId: 'en'},
    function(err, data) {
        expect(err).to.be.ok;
        done();
    });
  });
 it('should verify the reader user can NOT read the target data(qru)', function(done) {
    var proj = gaasReaderClient.bundle(projectId);
    proj.getStrings({ languageId: 'qru'},
    function(err, data) {
        expect(err).to.be.ok;
        done();
    });
  });

  it('Should verify the reader user can NOT read qru:key1 in ' + projectId, function(done) {
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .entry({languageId: 'qru', resourceKey: 'key1'})
        .getInfo({}, function(err, r) {
            expect(err).to.be.ok;
            done();
        });
  });
  
    it('Should verify the reader user can NOT read en:key1 in ' + projectId, function(done) {
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .entry({languageId: 'en', resourceKey: 'key1'})
        .getInfo({}, function(err, r) {
            expect(err).to.be.ok;
            done();
        });
  });
    
  it('Should change the reader user to read ' + projectId, function(done) {
    expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
    gaasAdminClient
        .user(readerInfo.credentials.userId)
        .update({
            bundles: [projectId3, projectId] // change bundles
        }, done);
  });
  
  it('Should verify the admin user can getInfo ' + projectId, function(done) {
    //   console.dir(adminInfo);
    expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
    gaasAdminClient
        .bundle(projectId)
        .getInfo({}, function(err, bund) {
            if(err) return done(err);
            expect(bund).to.be.ok;
            expect(bund.sourceLanguage).to.equal('en');
            expect(bund.metadata).to.deep.equal({});
            done();
        });
  });
  
  it('Should let the admin user set metadata ' + projectId, function(done) {
    expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
    gaasAdminClient
        .bundle(projectId)
        .update({
            metadata: { key: 'value'}
        }, done);
  });


  it('Should verify the admin user can read a key ' + projectId, function(done) {
    expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
    gaasAdminClient
        .bundle(projectId)
        .entry({languageId: 'qru', resourceKey: 'key1'})
        .getInfo({}, function(err, r) {
            if(err) return done(err);
            expect(r).to.be.ok;
            expect(r.value).to.equal(qruData[r.resourceKey]);
            done();
        });
  });

  it('should let the admin user verify the target data(qru)', function(done) {
    var proj = gaasAdminClient.bundle(projectId);
    proj.getStrings({ languageId: 'qru'},
    function(err, data) {
      if(err) {done(err); return; }
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(qruData));
      done();
    });
  });

  it('(not allowed) Should verify the reader user can now read a key ' + projectId/*, function(done) {
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .entry({languageId: 'qru', resourceKey: 'key1'})
        .getInfo({}, function(err, r) {
            if(err) return done(err);
            expect(r).to.be.ok;
            expect(r.value).to.equal(qruData[r.resourceKey]);
            done();
        });
  }*/);
  
  it('Should verify the reader can get basic bundle info ' + projectId, function(done) {
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .getInfo({}, function(err, b) {
            if(err) return done(err);
            expect(b).to.be.ok;
            expect(b.sourceLanguage).to.equal('en');
            expect(b.metadata).to.not.be.ok;
            done();
        });
  });

  it('Should verify the admin can get full bundle info ' + projectId, function(done) {
    expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
    gaasAdminClient
        .bundle(projectId)
        .getInfo({}, function(err, b) {
            if(err) return done(err);
            expect(b).to.be.ok;
            expect(b.sourceLanguage).to.equal('en');
            expect(b.metadata).to.deep.equal({key:'value'});
            done();
        });
  });
    
  it('should let the reader user verify the target data(qru)', function(done) {
    var proj = gaasReaderClient.bundle(projectId);
    proj.getStrings({ languageId: 'qru'},
    function(err, data) {
      if(err) {done(err); return; }
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(qruData));
      done();
    });
  });
  
    it('should let the admin user verify the source data(en)', function(done) {
    var proj = gaasAdminClient.bundle(projectId);
    proj.getStrings({ languageId: 'en'},
    function(err, data) {
      if(err) {done(err); return; }
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(sourceData));
      done();
    });
  });

  it('should let the reader user verify the source data(en)', function(done) {
    var proj = gaasReaderClient.bundle(projectId);
    proj.getStrings({ languageId: 'en'},
    function(err, data) {
      if(err) {done(err); return; }
      expect(data).to.have.a.property('resourceStrings');
      expect(JSON.stringify(data.resourceStrings)).to.equal(JSON.stringify(sourceData));
      done();
    });
  });
    
  it('Should let us verify the reader user has access to read ' + projectId, function (done) {
      gaasClient.users({ serviceInstance: instanceName }, function (err, users) {
          if (err) return done(err);
          expect(users).to.be.ok;
          expect(users).to.contain.keys([myUserInfo.userId, readerInfo.credentials.userId]);
          var u = users[readerInfo.credentials.userId];
          u.getInfo({}, function(err, user) {
                if(err) return done(err);
                expect(user).to.be.ok;
                expect(user.updatedBy).to.be.a('string');
                expect(user.updatedAt).to.be.a('date');
                expect(user.id).to.equal(readerInfo.credentials.userId);
                expect(user.bundles).to.have.members( [projectId3, projectId]);
                done();
            });
      });
  });

  it('Should verify the reader user can now getInfo ' + projectId, function(done) {
    //   console.dir(adminInfo);
    expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
    gaasReaderClient
        .bundle(projectId)
        .getInfo({}, function(err, bund) {
            if(err) return done(err);
            expect(bund).to.be.ok;
            expect(bund.sourceLanguage).to.equal('en');
            done();
        });
  });


  it('Should let us delete', function(done) {
    var proj = gaasClient.bundle({id:projectId, serviceInstance: instanceName});
    Q.ninvoke(proj, "delete", {})
    .then(function(resp) {
      done();
    }, done);
  });
  it('should now let me query the bundle list again (promises!)', function(done) {
    Q.ninvoke(gaasClient, "getBundleList", {serviceInstance: instanceName})
    .then(function(data) {
        expect(data).to.not.contain(projectId);
        done();
    },done);
  });
  if(!opts.credentials.isAdmin)  
     it('should now let me query the bundle list again without an instance id (promises!)', function(done) {
    Q.ninvoke(gaasClient, "getBundleList", {})
    .then(function(data) {
        expect(data).to.not.contain(projectId);
        done();
    },done);
  });
  it('test gaasClient(admin).bundle('+projectId3+').create(...)', function(done) {
    expect(gaasAdminClient).to.be.ok; // from previous test
    
    var proj = gaasAdminClient.bundle({id:projectId3});
    
    Q.ninvoke(proj, "create", {sourceLanguage: 'en', targetLanguages: ['es','qru']})
    .then(function(resp) {
      Q.ninvoke(proj, "uploadResourceStrings", {languageId: 'en', strings: {
        hello: 'Hello, World!'
      }})
      .then(function(resp){ done(); }, done);
    }, done);
  });
        
  // check READER
  var myAuth = function(opts){opts.auth = (readerInfo.credentials.userId+':'+readerInfo.credentials.password); };

  // if(opts.credentials.isAdmin) {
 
    
    gaasTest.expectCORSURL(urlEnv + '/rest/swagger.json',
                        null, ' noauth');
                        
    gaasTest.expectCORSURL(urlEnv + '/rest/swagger.json',
                        myAuth, ' reader');
  
    // hardcoded URL here..
    gaasTest.expectCORSURL(urlEnv + '/rest/' + instanceName + '/v2/bundles/'+projectId3+'/qru',
                        myAuth, ' reader');
  
    // // this should authenticate but NOT be CORS
  
  
    // check ADMINISTRATOR
    var myAdminAuth = function(opts) {
      if(!opts.headers) opts.headers = {};
      // this is a callback because the user info isn't defined until AFTER the inner 'it()' is called. 
      var myHmac = new GaasHmac('gaashmac',myUserInfo.userId,
                myUserInfo.password);
      myHmac.apply(opts);
    };
  
    gaasTest.expectCORSURL(urlEnv + '/rest/swagger.json',
                        myAdminAuth, ' admin');
  
    // hardcoded URL here..
    gaasTest.expectCORSURL(urlEnv + '/rest/' + instanceName + '/v2/bundles/'+projectId3+'/qru',
                        myAdminAuth, ' admin');
    // if(isAdmin) {
    //   gaasTest.expectNonCORSURL(urlEnv + '/rest/' + instanceName + '/v2/bundles',
    //                       myAdminAuth, ' admin');    
    // }


    it('Should verify the admin user can read bundle info ' + projectId3, function(done) {
        expect(gaasAdminClient).to.be.ok; // otherwise, user creation failed
        gaasAdminClient
            .bundle(projectId3)
            .getInfo({}, function(err, bund) {
                if(err) return done(err);
                expect(bund).to.be.ok;
                expect(bund.sourceLanguage).to.equal('en');
                done();
            });
    });

    it('Should verify the reader user can read bundle info ' + projectId3, function(done) {
        expect(gaasReaderClient).to.be.ok; // otherwise, user creation failed
        gaasReaderClient
            .bundle(projectId3)
            .getInfo({}, function(err, bund) {
                if(err) return done(err);
                expect(bund).to.be.ok;
                expect(bund.sourceLanguage).to.equal('en');
                done();
            });
    });

  if(!NO_DELETE && !opts.credentials.isAdmin) {
    describe('Clean-up time for ' + instanceName, function() {
      it('should let me delete an admin user', function(done) {
        expect(myUserInfo.userId).to.be.ok;
        gaasClient.user(myUserInfo.userId).delete(done);
      });
      it('should let me delete a reader user', function(done) {
        expect(readerInfo.credentials.userId).to.be.ok;
        gaasClient.user(readerInfo.credentials.userId).delete(done);
      });
      it('Should let us call client.users() and verify users gone', function(done) {
        gaasClient.users({serviceInstance: instanceName}, function(err, users) {
            if(err) return done(err);
            expect(users).to.be.ok;
            expect(users).to.not.contain.keys([myUserInfo.userId, readerInfo.credentials.userId])
            done();
        });
      });
    });
  }
});

// unless !delete?
if(NO_DELETE) {
  describe('gaasClient.delete', function() {
    it('(skipped- NO_DELETE)');
  });
} else if(opts.credentials.isAdmin) {
    describe('gaasClient.delete instance ' + instanceName, function() {
    it('should let us delete our instance', function(done) {
      gaasClient.ready(done, function(err, done, apis) {
        if(err) { done(err); return; }
        apis.admin.deleteServiceInstance({
          serviceInstanceId: instanceName
        }, function onSuccess(o) {
          if(o.obj.status !== 'SUCCESS') {
            done(Error(o.obj.status));
          } else {
            //console.dir(o.obj, {depth: null, color: true});
            done();
          }
        }, function onFailure(o) {
          done(Error('Failed: ' + o));
        });
      });
    });
  });
}
//  END NO_DELETE

// end of client-test
