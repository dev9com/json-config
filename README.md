# json-config #

This project builds the JSON configuration for Classmates.com. 

## Usage ##

To run the builder, simply run ```./gradlew``` at the root of the project. ```./gradlew``` is a script commonly referred to as the [Gradle Wrapper](http://www.gradle.org/docs/current/userguide/gradle_wrapper.html). It will download and install a Gradle runtime if you do not have one. 

## Frameworks ##

This builder makes use of several frameworks. In no particular order:

- [Gradle](http://www.gradle.org) for building the output
- [Typesafe Config](https://github.com/typesafehub/config) for interpreting the ```.conf``` files, and writing the ```.json``` output files correctly

## Using this Builder ##

Using this builder is quite straighforward. In short, you add configuration files to ```src/main/conf``` with the extension ```.conf```. The new object will automatically be picked up. See the Typesafe Config page for details on the syntax of conf files, but for all intents and purposes, it's a relaxed JSON standard. 

Each file should include a block for defaults, named ```default```. This is the configuration that will be used in the absense of any environment-specific customizations. See the section below on Heirarchical Configuration. In addition to default, any environment-specific configuration can be included in this file, just put each environment at the top level. Under each of these top-level blocks, put the structure you want for the final config file. For example, a database configuration might look like this: 

    default {
        db {
            user: "user"
            password: "password"
        }
    }
    
    qa09 {
        db: ${default.db} {
            host: "qa09-db.cmates.com"
        }
    }

In the example above, notice the relaxed structure of JSON: no root object braces, no commas between elements, no colons for blocks. 

## Bundles ##

This builder does a few things. It creates a file in ```build/{env}/config.json``` that is the full set of properties compiled for that environment. In addition, we are supporting the generation of a limited subset of that config file, a term we are calling bundles. To create a new bundle, simply add a file at ```src/bundles/{bundle}.conf```. Look at the README.md in that directory if you want more specific information around bundles. The generated files will be placed at ```build/{env}/{bundle}.json```. 

## Heirarchical Config ##

Look at that qa09.db section again. See the ${default.db}? That's basically telling Typesafe Config to take the ${default.db} object, and lay the rest of the object on top of it, overriding any duplicate properties that exist, and merging smartly for all nested objects. This is the core of how all of the individual files work, and the core of Heirarchical Configuration. Imagine all of the files are concatenated together, you might end up with an intermediate file like this: 

    default {
        db { 
            user: "user"
            password: "password"
        }
    }
    
    qa09 {
        db: ${default.db} {
            host: "qa09-db.cmates.com"
        }
    }
    
    default {
        msg {
            hello: "world"
            ping: {
                send: "ping"
                get: "pong"
            }
        }
    }
    
    qa09 {
        msg: ${default.msg} {
            hello: "doggie"
        }
    }
    
    qa00 {
        msg: {
            wat: "wat?"
        }
    }

Once we go through a process called "resolution", you would end up with a config like this: 

    default {
        db {
            user: "user"
            password: "password"
        }
    
        msg {
            hello: "world"
            ping: {
                send: "ping"
                get: "pong"
            }
        }
    }
    
    qa09 {
        db {
            user: "user"
            password: "password"
            host: "qa09-db.cmates.com"
        }
    
        msg {
            hello: "doggie"
            ping: {
                send: "ping"
                get: "pong"
            }
        }
    }
    
    qa00 {
        msg {
            wat: "wat?
        }
    }

Each of these top-level elements are then written out to ```build/{env}/config.json```. 

## Design Considerations ##

### Why JSON? ###

JSON has several benefits when it comes to configuration:

- The structure of objects often better supports the nature of configuration
- JSON objects can be merged smartly
- Syntax can easily be validated
- Easily machine- and human-readable
- Easily machine- and human-writable

### Using in Your Application ###

In order to use these files in the best way possible, this is our understanding of how these files will be used:

- We will use a Heirarchical Config engine on the usage side. Java projects can use Typesafe Config, Node projects can use [nconf](https://github.com/flatiron/nconf)
- There will be an ops-controlled file that takes highest priority. This will probably be called ```secrets.conf```. This is the place we will store sensitive data, such as passwords, api keys, and auth tokens. These files will be unreadable to any user except the owner of the process and the root user. 
- The engines will load the environment-specific file first, then use the defaults config as a fallback. This file will be readable by any user with login rights. 
- The application will query environment variables to discover the current environment, then load that file. The rest of the application should be ignorant of the environment. 
- We allow developers to specify configuration overrides locally. 

The upshot of all of this, in heirarchical terms, results in loading files and resolving values in this order: 

0. From the environment and command line parameters. 
1. From ${user.home}/.cm-config-local.json
2. From /opt/cmates/config/{env}/secret.json (if env is available)
3. From /opt/cmates/config/{env}/config.json (if env is available)
4. From /opt/cmates/config/default/config.json

In order to do overrides through the environment or command line, use dotted notation. For example, to replace the db host in our examples above, you could do something like this: 

    $> java (everything else) -Ddb.host="new-db.cmates.com"

As for querying the environment, you can simply run the process with environment variables on the command line, or they can exist already: 

    $> ENV=dev java (everything else)
    
    $> export ENV=dev
    $> java (everything else)

Look for an example of this in our software-reasearch project on git. 

### Extend or Inherit? ###

Notice we were extending the default block in the db example above to fill in the rest of the guts for the db block for qa09. We could also rely on the heirarchy filling in those values from the default config file. What to do? In an unsatisfying reoslution, this is a judgement call. 

With extension, we get more fully fleshed-out JSON files at the build stage, and we can visually inspect for any errors. The downside is that the files might be significantly larger. 

With inheritcance, we have a cleaner separation of default config vs. environment-specific overrides, but it might require more knowledge of end-use to properly interpret the file. 

As of this writing, I (Dustin) personally prefer the extension model, and the files are built accordingly. Being as this project "compiles" our source files, the final file size is rather irrelevant. In addition, the full JSON document will be usable as a standalone configuration object. 