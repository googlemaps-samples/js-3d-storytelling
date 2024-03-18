# 3D Storytelling

![3D Storytelling video](https://storage.googleapis.com/3d-solutions-assets/storytelling-1080p-overview.gif)


## Overview

You can build your 3D Storytelling solution using the sample app.

Explore the [hosted app](https://js-3d-storytelling-admin-t6a6o7lkja-uc.a.run.app/).

Create a fork and 

This repository consists of two parts. The Storytelling app and an Admin app which adds a control panel for settings.

## Installation

### Prerequisits

The solution leverages Google maps Platform Photorealistic 3D tiles with Cesium.js as the renderer. Enable all the following APIs:

- [Map Tiles API](https://console.cloud.google.com/marketplace/product/google/tile.googleapis.com?utm_source=3d_solutions_storytelling)
- [Maps JavaScript API](https://console.cloud.google.com/marketplace/product/google/maps-backend.googleapis.com?utm_source=3d_solutions_storytelling)
- [Places API](https://console.cloud.google.com/marketplace/product/google/places-backend.googleapis.com?utm_source=3d_solutions_storytelling)

You need to create a [Google API Key](https://console.cloud.google.com/apis/credentials) and restrict it to at least these APIs.

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

The camera object in the story and chapter properties. The location, where the camera is positioned in the 3D space is configured in the `position` object. The orientation, what the camera is looking at, is set via `heading`, `pitch` and `roll`.

### Cesium / Globe

Most of the cesium setting are located and documented in `/src/utils/cesium.js`.

Here are some highlights:


**RADIUS**: The radius from the target point to position the camera.
**BASE_PITCH_RADIANS**: The base pitch of the camera. Defaults to -30 degrees in radians.
**BASE_HEADING_RADIANS**: The base heading of the camera. Defaults to 180 degrees in radians.
**DEFAULT_HIGHLIGHT_RADIUS**: The default radius size of the highlighted area.

## Local Development

For the local development you still need the API key for 3D Map Tiles and Google Places/Maps requests.

### NodeJS server

You can  use your own local web server to show the Storytelling app:

- Copy the env.example.js to env.js and update the APIKEY variable

- `npx http-server -p 5500 ./src`

To start the local server in admin mode do the following: 

- Copy the files in demo/src to demo/

Bash command for above step is `cp -r ../demo/src ./demo` 

- In index.html, at the end of the file, it has reference to main.js. Change it to demo/sidebar.js.

Bash command for above `sed -i "s/main.js/demo\/sidebar.js/g" index.html` 

And then you can start the node app by running `npx http-server -p 5500 ./src`

### Docker

You need to have docker installed to best work with the **demo-app** locally. If you want to play with the demo without a local installation you can always use our [hosted version](url)

1. Clone the repository
2. `docker-compose build demo`
3. `docker-compose up demo`

There is a second docker compose service `docker-compose up app` which  serves the admin app. For this you may need to update the `config.json` file to include your data.

### IDEs

Most IDEs include some kind of server for static files. Just point it to the `./src` directory and set the right port.

## Deployment

To deploy the 3D Story telling app you need to upload everything in the `src` folder to a static web server or some other hosting service. A static web server is enough. You need a domain for you webspace, though. Since the Google Maps API key is only restricted on a domain you would risk misuse of the key.

Included in the repository is a `Dockerfile` which can be used to build a docker image. This can be used to deploy with Google Cloud Run or other container cloud services.

## Repository structure

The repositiory is structured to have separate folder for the actual app (`/src`) and the demo/configuration-ui (`/demo/src`). This is due to fact that we need to deploy different versions.

The app part of the repository is self contained and can be used as is (after updating the configuration). This will show the globe with 3D tiles. Centered on the `location` setting in `config.json`. It will be filled with places from the Google Places API (configured in `config.json`).

The demo folder contains additional code to render a configuration UI to play with the settings in the `config.json`. The code is added to the deployment by running the `/demo/Dockerfile`.


## Terms of Service

This library uses Google Maps Platform services, and any use of Google Maps Platform is subject to the Terms of Service.

For clarity, this library, and each underlying component, is not a Google Maps Platform Core Service.

## Support

This library is offered via an open source license. It is not governed by the Google Maps Platform Support Technical Support Services Guidelines, the SLA, or the Deprecation Policy (however, any Google Maps Platform services used by the library remain subject to the Google Maps Platform Terms of Service).

This library adheres to semantic versioning to indicate when backwards-incompatible changes are introduced. Accordingly, while the library is in version 0.x, backwards-incompatible changes may be introduced at any time.

If you find a bug, or have a feature request, please file an issue on GitHub. If you would like to get answers to technical questions from other Google Maps Platform developers, ask through one of our developer community channels. If you'd like to contribute, please check the Contributing guide.

You can also discuss this library on our Discord server.