# 3D Storytelling

## Team

- PM Ubilabs: Martin Kleppe <kleppe@ubilabs.com>
- PM Ubilabs: Annika Bock <bock@ubilabs.com>
- DEV Ubilabs: Moritz Becker <becker@ubilabs.com>
- DEV Ubilabs: Immo Beeck <beeck@ubilabs.com>
- DEV Ubilabs: Frank Mecklenburg <mecklenburg@ubilabs.com>
- Design Ubilabs: Elena Menzel <menzel@ubilabs.com>

## Overview

This project aims to create a tool to create interactive digital storytelling solutions. The demo will be featured at the Architecture Center, allowing users to show, create and play with different option for a storytelling solution on the backdrop of Google Maps 3d Tiles.

This repository consists of two parts. The actual app, Story Telling, and a demo app which adds a control panel for settings.

## Installation

### Prerequisits

You need to create a [Google API Key](https://console.cloud.google.com/apis/credentials) and restrict it to at least these there APIs.

- Map Tiles API
- Maps JavaScript API
- Places API

Also, it is always a good idea to add restrictions for specific websites (i.e. `localhost:5500` for local development).

### Storytelling Solution

There are no external dependencies to view and work with the Storytelling Solution and Demo.

1. download the content of the `src` folder
2. adjust the `config.json` to your needs (see [Configuration](#Configuration))
3. add your API key to `env.js` (see [env.exmaple.js](src/env.exmaple.js))
4. serve the files with a static webserver

If you want to play with the demo (with a configuration UI) without a [local installation](#local-development) you can always use our [hosted version](url).

## Configuration

You can edit the `config.json` file in the `src` directory to change settings. It is also possible to implement your own `loadConfig` function to get configuration from a different file on a different server or to request an API which dynamically returns configuration.


### Story configuration

The `properties` object in the `config.json` is responsible for the overall story settings. Here you can set the hero image, title, date, description and inital camera position of the story as a whole.

### Chapter

The `chapters` property of the config object holds an array of all the story chapters. For each chapter there are different options to set. For example the cahpter title image/video url geo-coordinates and other content. Additionaly you can adjust the camera position and heading (`cameraOptions`), and how to focus the chapter location on the globe (`focusOptions`).

### Camera

The camera object in the story and chapter properties. The location, where the camera is positioned in the 3D space is configured in the `position` object. The heading, where the camera is looking from the position, is set via `heading`, `pitch` and `roll`.

### Cesium / Globe

Most of the cesium setting are located and documented in `/src/utils/cesium.js`.

Here are some highlights:


**RADIUS**: The radius from the target point to position the camera.
**BASE_PITCH_RADIANS**: The base pitch of the camera. Defaults to -30 degrees in radians.
**BASE_HEADING_RADIANS**: The base heading of the camera. Defaults to 180 degrees in radians.
**DEFAULT_HIGHLIGHT_RADIUS**: The default radius size of the highlighted area.

## Local Development

For the local development you still need the API key for 3D Map Tiles and Google Places/Maps requests.

### Docker

You need to have docker installed to best work with the **demo-app** locally. If you want to play with the demo without a local installation you can always use our [hosted version](url)

1. Clone the repository
2. `docker-compose build demo`
3. `docker-compose up demo`

There is a second docker compose service `docker-compose up app` which only serves the final app. For this you may need to update the `config.json` file to include you data.

### NodeJS server

You can always use your own local webserver to show the Neighbourhood Discovery app like so:

`npx http-server -p 5500 ./src`

### IDEs

Most IDEs include some kind of server for static files. Just point it to the `./src` directory and set the right port.

## Deployment

To deploy the neighbourhood discovery you need to upload everything in the `src` folder to a static webserver or some other hosting service. A static webserver is enough. You need a domain for you webspace, though. Since the Google Maps API key is only restricted on a domain you would risk missuse of the key.

Included in the repository is a `Dockerfile` which can be used to build a docker image. This can be used to deploy with Google Cloud Run or other container cloud services.

## Repository structure

The repositiory is structured to have separate folder for the actual app (`/src`) and the demo/configuration-ui (`/demo/src`). This is due to fact that we need to deploy different versions.

The app part of the repository is self contained and can be used as is (after updating the configuration). This will show the globe with 3D tiles. Centered on the `location` setting in `config.json`. It will be filled with places from the Google Places API (configured in `config.json`).

The demo folder contains additional code to render a configuration UI to play with the settings in the `config.json`. The code is added to the deployment by way of the `/demo/Dockerfile`.
