# botium-cli
Botium CLI - The Selenium for Chatbots

Documentation available in the [Botium Wiki](https://github.com/codeforequity-at/botium-core/wiki/The-Botium-CLI)


```
> npm install -g botium-cli
> botium-cli
Botium CLI

Usage: botium-cli.js [options]

Commands:
  botium-cli.js run [output]     Run Botium convo files and output test report
                                 with Mocha test runner
  botium-cli.js import [source]  Importing conversations for Botium
  botium-cli.js emulator [ui]    Launch Botium emulator
  botium-cli.js agent            Launch Botium agent

Options:
  --help, -h     Show help                                             [boolean]
  --version, -V  Show version number                                   [boolean]
  --verbose, -v  Enable verbose output (also read from env variable
                 "BOTIUM_VERBOSE" - "1" means verbose)          [default: false]
  --convos, -C   Path to a directory holding your convo files. Can be specified
                 more than once, ending in "--" ("... --convos dir1 dir2 dir3 --
                 ...") (also read from env variables starting with
                 "BOTIUM_CONVOS")                         [array] [default: "."]
  --config, -c   Path to the Botium configuration file (also read from env
                 variable "BOTIUM_CONFIG")            [default: "./botium.json"]
```



