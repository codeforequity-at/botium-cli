Botium CLI - The Selenium for Chatbots
======================================

[![NPM](https://nodei.co/npm/botium-cli.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-cli/)

[ ![Codeship Status for codeforequity-at/botium-cli](https://app.codeship.com/projects/4d7fd410-18ab-0136-6ab1-6e2b4bb62b94/status?branch=master)](https://app.codeship.com/projects/283938)
[![npm version](https://badge.fury.io/js/botium-cli.svg)](https://badge.fury.io/js/botium-cli)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

Botium is the Selenium for chatbots. Botium CLI is the swiss army knife of Botium.

# How do I get help ?
* Read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) series
* If you think you found a bug in Botium, please use the Github issue tracker.
* The documentation on a very technical level can be found in the [Botium Wiki](https://github.com/codeforequity-at/botium-core/wiki).
* For asking questions please use Stackoverflow - we are monitoring and answering questions there.
* For our VIP users, there is also a Slack workspace available (coming soon).

## Installation

### Download latest executable, standalone program from [here](http://botium-artifacts.s3-website-eu-west-1.amazonaws.com/) ###

In case you have Node.js installed on your system, just install the botium-cli module globally:

```
> npm install -g botium-cli
```


## Usage

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles ? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

Prepare and run a simple Botium test case:

```
> botium-cli init
> botium-cli run
```

Got get help on the command line options:

```
> botium-cli help
Botium CLI

Usage: botium-cli.js [options]

Commands:
  botium-cli.js run [output]     Run Botium convo files and output test report
                                 with Mocha test runner
  botium-cli.js import [source]  Importing conversations for Botium
  botium-cli.js emulator [ui]    Launch Botium emulator
  botium-cli.js box [output]     Run Test Project on Botium Box and output test
                                 report with Mocha test runner
  botium-cli.js init             Setup a directory for Botium usage
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

You need at least one command before moving on
```
