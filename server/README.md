# Config Server #

This is an example of what you can do using JSON configuration. In 42 lines of nodejs, we can serve up config on a live server. This code is not production-hardened. 

## How to Run ##

First, build the config in the parent directory: 

```
    $> ./gradlew
```

Then, go into the server directory, and start it...

```
    $> cd server
    $> npm install
    $> node server.js
```

## How to Use ##

Make GET requests to the server. The path you request on is translated, and a valid JSON object is returned, or a 404 is emitted. If you request no path, you get the full config object. This can reveal secrets if you use it like that in prod, so you'll probably want to customize it, or at least put it behind a firewall. 