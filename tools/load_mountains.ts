// Reads mountain JSON data from stdin and commits to the DB via sequelize.
// Used by load_mountains.py.

import * as readline from "readline";

import * as asyncMutex from "async-mutex";
import * as dotenv from "dotenv";
import { find as findTz } from "geo-tz";
import { Point } from "geojson";

import { Mountain, MountainSource } from "../src/model/Mountain";
import { connectToDb } from "../src/model/connection";

dotenv.config();

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: null,
    terminal: false,
  });

  const connection = await connectToDb();

  // This is used to ensure the "close" event doesn't cause the script to exit
  // while a "line" event is still being processed.
  const mu = new asyncMutex.Mutex();

  rl.on("line", async (line) => {
    const release = await mu.acquire();

    const mountainJson = JSON.parse(line);
    const location: Point = {
      type: "Point",
      coordinates: [
        mountainJson.location.long,
        mountainJson.location.lat,
        mountainJson.location.elevation,
      ],
    };
    const timeZone = findTz(
      mountainJson.location.lat,
      mountainJson.location.long
    )[0];

    const mountain = new Mountain();
    mountain.source = MountainSource.dbpedia;
    mountain.sourceId = mountainJson.uri;
    mountain.name = mountainJson.name;
    mountain.location = location;
    mountain.timeZone = timeZone;
    mountain.wikipediaLink = mountainJson.wikipedia_link;
    mountain.abstract = mountainJson.abstract;
    await connection.manager.save(mountain);

    release();
  }).on("close", async () => {
    await mu.acquire();
    process.exit(0);
  });
}

main();
