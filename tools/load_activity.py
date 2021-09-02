#! /usr/bin/env python3

from absl import app
from absl import flags
from absl import logging
import json
import polyline
import psycopg2
import requests
from typing import Any, Dict, Text

FLAGS = flags.FLAGS

flags.DEFINE_string("activity_id", "", "Activity ID to retrieve from Strava.")
flags.DEFINE_string("activity_path", "", "Path to strava activity json file.")

flags.DEFINE_string(
    "access_token", "",
    "Strava API access token (only relevant if -activity provided)")

flags.DEFINE_string("postgres_db", "marshall", "DB name to populate.")
flags.DEFINE_string("postgres_username", "", "PostgreSQL username.")


def load_from_strava(id: int, access_token: Text) -> Dict[Text, Any]:
  url = "https://www.strava.com/api/v3/activities/{}".format(id)
  headers = {"Authorization": "Bearer {}".format(access_token)}
  r = requests.get(url, headers=headers)
  return r.json()


def load_local(path: Text) -> Dict[Text, Any]:
  with open(path, "r") as file:
    return json.loads(file.read())


def polyline_to_linestring(polyline_string: Text) -> Text:
  lat_longs = polyline.decode(polyline_string)
  return "LINESTRING(" + ",".join(
      ("{} {}".format(long, lat) for lat, long in lat_longs)) + ")"


def insert_activity(db_name: Text, username: Text, activity: Dict[Text,
                                                                  Any]) -> None:
  linestring = polyline_to_linestring(activity["map"]["polyline"])
  with psycopg2.connect("dbname={} user={}".format(db_name, username)) as conn:
    with conn.cursor() as cur:
      cur.execute(
          "INSERT INTO activities VALUES (%s, ST_GeographyFromText(%s), %s)",
          (activity["id"], linestring, json.dumps(activity)))


def main(argv):
  if FLAGS.activity_id and FLAGS.activity_path:
    logging.fatal(
        "activity_id and activity_path flags can't both be specified.")

  if FLAGS.activity_id:
    activity = load_from_strava(FLAGS.activity_id, FLAGS.access_token)
  elif FLAGS.activity_path:
    activity = load_local(FLAGS.activity_path)

  logging.info("Activity id: %s", activity["id"])
  insert_activity(FLAGS.postgres_db, FLAGS.postgres_username, activity)


if __name__ == "__main__":
  app.run(main)
