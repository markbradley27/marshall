// Reads mountain JSON data from stdin and commits to the DB via sequelize.
// Used by load_mountains.py.

import * as dotenv from "dotenv";
dotenv.config();

import * as asyncMutex from "async-mutex";
import * as readline from "readline";

import { sequelize, Mountain, MountainSource } from "../src/model";

const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false,
});

// This is used to ensure the "close" event doesn't cause the script to exit
// while a "line" event is still being processed.
const mu = new asyncMutex.Mutex();

rl.on("line", async (line) => {
  const release = await mu.acquire();

  const mountain = JSON.parse(line);
  const location_geojson = {
    type: "Point",
    coordinates: [
      mountain.location.long,
      mountain.location.lat,
      mountain.location.elevation,
    ],
  };

  await Mountain.create({
    source: MountainSource.dbpedia,
    sourceId: mountain.uri,
    name: mountain.name,
    location: location_geojson,
    wikipediaLink: mountain.wikipedia_link,
    abstract: mountain.abstract,
  });

  release();
}).on("close", async () => {
  await mu.acquire();
  process.exit(0);
});
