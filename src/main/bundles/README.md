# Configuration Bundles #

To create a new "bundle", you simply add a file into this directory. The basic structure is like so:
```
     includes: [hosts, servers]          <-- A list of paths to include from the environment config file to your bundle
                                         <--   This can include dotted paths 
                                         <--   All config elements will be kept at the same level
                                         <--   If you leave this element out, all configuration options will be copied.

     remove: ["hosts.envSlug", ...]      <-- A list of paths to remove from the output
                                         <--   If you leave this element out, nothing will be removed. 
```
 
And that's it. See the hosts.conf file for a basic example
