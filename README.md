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
```

# Botium Capabilities configuration

The chatbot capabilities are described in a configuration file. By default, the file named "botium.json" in the current directory is used, but it can be specified with the "--config" command line parameter.
The configuration file holds capabilities, envs and sources. Configuration via environment variables is supported as well.


```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "botium-sample1",
      ....
    },
    "Sources: {
      ....
    },
    "Envs": {
      "NODE_TLS_REJECT_UNAUTHORIZED": 0,
      ....
    }
  }
}
```

# Commands

## botium-cli init

Prepare a directory for Botium usage:
* Adds a simple botium.json
* Adds a sample convo file

## botium-cli run

Automatically run all your scripted conversations against your chatbot and output a test report

## botium-cli import

Import conversation scripts or utterances from some source (for example, from IBM Watson workspace)

## botium-cli emulator

Especially with structured messages, it can become uncomfortable to write conversation files manually. Botium contains two emulators to support you with browsing and writing your conversation files:

### Browser Emulator
The Botium Browser Emulator provides a simple browser interface to record and organize your test cases, and to interact with your Chatbot.

![Botium Browser Emulator](https://github.com/codeforequity-at/botium-docs/blob/master/deprecated/screenshots/ide_demo.png)

Running it is simple:

    $ botium-cli emulator browser

To specify directory holding your convo files and to specify the configuration file:

    $ botium-cli emulator browser --convos=./spec/convo --config=./spec/botium.json

### Console Emulator
The Botium Console Emulator is a basic command line interface to your chatbot running within Botium . You can record and save your conversation files.

![Botium Console Emulator](https://github.com/codeforequity-at/botium-docs/blob/master/deprecated/screenshots/chat.png)

Running it is simple:

    $ botium-cli emulator console


