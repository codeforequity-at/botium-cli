Botium CLI - The Selenium for Chatbots
======================================

[![NPM](https://nodei.co/npm/botium-cli.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-cli/)

[ ![Codeship Status for codeforequity-at/botium-cli](https://app.codeship.com/projects/4d7fd410-18ab-0136-6ab1-6e2b4bb62b94/status?branch=master)](https://app.codeship.com/projects/283938)
[![npm version](https://badge.fury.io/js/botium-cli.svg)](https://badge.fury.io/js/botium-cli)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

Botium is the Selenium for chatbots. Botium CLI is the swiss army knife of Botium.

**_IF YOU LIKE WHAT YOU SEE, PLEASE CONSIDER GIVING US A STAR ON GITHUB!_**

# How do I get help ?
* Read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) series
* If you think you found a bug in Botium, please use the Github issue tracker.
* The documentation on a very technical level can be found in the [Botium Wiki](https://github.com/codeforequity-at/botium-core/wiki).
* For asking questions please use Stackoverflow - we are monitoring and answering questions there.
* For our VIP users, there is also a Slack workspace available (coming soon).

## Installation

```
> npm install -g botium-cli
```

_See below to see instructions how to use the Botium CLI docker image_

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

## botium-cli init-dev [connector|asserter|logichook]

Setup a boilerplate development project for Botium connectors, asserters or logic hooks in the current directory:
* Adds a Javascript source file with the skeleton code
* Adds a botium.json with connector/asserter/logic hook registration
* Adds a sample convo file

## botium-cli run

Automatically run all your scripted conversations against your chatbot and output a test report

## botium-cli nlpanalytics <algorithm>

Runs NLP analytics with the selected algorithm.

* **validate** - run one-shot training and testing of NLP engine
* **k-fold** - run k-fold training and testing of NLP engine

See [this article](https://chatbotslife.com/tutorial-benchmark-your-chatbot-on-watson-dialogflow-wit-ai-and-more-92885b4fbd48) for further information.

## botium-cli nlpextract

Extract utterances from selected Botium connector and write to [Botium Utterances files](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/48922633/Composing+in+Text+files). Supported not by all connectors, please check [connector documentation](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/360553/Botium+Connectors). Supported amongst others by:

* Dialogflow
* IBM Watson
* Amazon Lex
* Wit.ai
* NLP.js

and more to come.

## botium-cli *import

Import conversation scripts or utterances from some source (for example, from IBM Watson workspace)

## botium-cli inbound-proxy

Launch an HTTP/JSON endpoint for inbound messages, forwarding them to Redis to make them consumable by Botium Core.

See [Botium Wiki](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/24510469/Generic+HTTP+S+JSON+Connector) how to use.

## botium-cli emulator

The Botium Console Emulator is a basic command line interface to your chatbot running within Botium. You can record and save your conversation files.

![Botium Console Emulator](https://github.com/codeforequity-at/botium-docs/blob/master/deprecated/screenshots/chat.png)

Running it is simple:

    $ botium-cli emulator console

# Using the Botium CLI docker image

Instead of installing the NPM package, you can use the Botium CLI docker image instead:

    $ docker run --rm -v $(pwd):/app/workdir botium/botium-cli

You can use all commands as described above. Special considerations:

* You cannot use absolute pathes, but all pathes should be given relative to the current working directory. The current working directory is mapped to the docker container with the _-v_ switch (above this is mapped to the current working directory)
* For running the console emulator, you will have to add the _-it_ flag to the docker command to enable terminal interactions:
```
$ docker run --rm -v $(pwd):/app/workdir -it botium/botium-cli emulator console
```

## Usage under Windows

When using the above command under Windows, especially with _git bash_, you may receive an error like this:

```
C:\Program Files\Docker\Docker\Resources\bin\docker.exe: Error response from daemon: Mount denied:
The source path "C:/dev/xxxxx;C"
doesn't exist and is not known to Docker.
```

In this case you have to disable the bash path conversion:

     > export MSYS_NO_PATHCONV=1



