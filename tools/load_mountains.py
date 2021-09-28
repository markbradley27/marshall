#! /usr/bin/env python3

import abc
from absl import app
from absl import flags
from absl import logging
import bs4
import datetime
import inquirer
import json
import psycopg2
import re
import requests
import SPARQLWrapper
import subprocess
from typing import Any, Dict, Generator, Text, Tuple

FLAGS = flags.FLAGS

flags.DEFINE_string('name', '', 'Name of mountain to search for and insert.')
flags.DEFINE_string(
    'uri', '',
    'URI of mountain to insert (-n is ignored if this is specified).')
flags.DEFINE_integer(
    'n', 1,
    'Number of mountains to retrieve (anything less than 0 retrieves all).')
flags.DEFINE_integer('sparql_page_size', 100,
                     'Max number of mountain URIs to retrieve at once.')

flags.DEFINE_enum('db', 'sequelize', ['postgres', 'sequelize', 'log'],
                  'DB type to connect to.')

flags.DEFINE_string('postgres_db', 'marshall', 'DB name to populate.')
flags.DEFINE_string('postgres_username', '', 'PostgreSQL username.')

flags.DEFINE_bool(
    'log_raw_parsed', False,
    'If logging output, controls whether the raw_parsed object is logged.')

_DBPEDIA_SPARQL_ENDPOINT = "http://dbpedia.org/sparql"


class DBInterface(metaclass=abc.ABCMeta):

  @abc.abstractmethod
  def insert_mountain(self, mountain: Dict[Text, Text]) -> None:
    pass


class PostgresDB(DBInterface):

  def __init__(self, db_name: Text, username: Text):
    self._conn = psycopg2.connect("dbname={} user={}".format(db_name, username))

  def __del__(self):
    self._conn.close()

  def insert_mountain(self, mountain: Dict[Text, Any]) -> None:
    logging.info("Inserting via Postgres: {}".format(mountain["uri"]))
    with self._conn.cursor() as cur:
      now = datetime.datetime.now()
      cur.execute(
          """INSERT INTO "Mountains" 
          (source, name, location, "createdAt", "updatedAt")
          VALUES (%s, %s, ST_MakePoint(%s, %s, %s)::geography, %s, %s)""",
          (mountain["uri"], mountain["name"], mountain["location"]["long"],
           mountain["location"]["lat"], mountain["location"]["elevation"], now,
           now))
      self._conn.commit()


# Bit of a misnomer, sequelize spins up a ts-node process that commits to the
# Postgres DB using the Sequelize model (as opposed to the PostgresDB class
# which commits directly and likely incorrectly to the DB).
class SequelizeDB(DBInterface):

  def __init__(self):
    self.ts_load_mountains = subprocess.Popen(
        ["npx", "ts-node", "tools/load_mountains.ts"],
        stdin=subprocess.PIPE,
        encoding="utf-8")

  def __del__(self):
    self.ts_load_mountains.stdin.flush()
    self.ts_load_mountains.stdin.close()
    self.ts_load_mountains.wait()

  def insert_mountain(self, mountain: Dict[Text, Any]) -> None:
    logging.info("Inserting via Sequelize: %s", mountain["uri"])
    self.ts_load_mountains.stdin.write("{}\r\n".format(json.dumps(mountain)))


class LogDB(DBInterface):

  def __init__(self, log_raw_parsed):
    self._log_raw_parsed = log_raw_parsed

  def insert_mountain(self, mountain: Dict[Text, Any]) -> None:
    if not self._log_raw_parsed:
      mountain["raw_parsed"] = "<redacted>"
    logging.info(json.dumps(mountain))


# Takes the big awful s/p/o format spat out by sparql and turns it in to a key:
# val dictionary.
def parse_sparql_mountain(sparql_json: Dict[Text, Any]) -> Dict[Text, Any]:
  parsed = {}
  for spo in sparql_json["results"]["bindings"]:
    predicate = spo["p"]["value"]
    obj = spo["o"]["value"]
    if predicate not in parsed:
      parsed[predicate] = obj
    else:
      if isinstance(parsed[predicate], list):
        parsed[predicate].append(obj)
      else:
        parsed[predicate] = [parsed[predicate], obj]
  return parsed


def scrape_location_from_wikipedia(
    parsed: Dict[Text, Any]) -> Tuple[float, float, float]:
  # TODO: Beautiful soup parsing could probably be more elegant.
  wiki_page_link = parsed["http://xmlns.com/foaf/0.1/isPrimaryTopicOf"]
  wiki_page_req = requests.get(wiki_page_link)
  wiki_page = bs4.BeautifulSoup(wiki_page_req.text, "html.parser")

  def is_infobox_table(tag):
    return tag.name == "table" and "infobox" in tag.get_attribute_list("class")

  infobox_table_tags = wiki_page.find_all(is_infobox_table)
  if len(infobox_table_tags) > 1:
    raise ValueError(
        "Found more than one infobox table for {}".format(wiki_page_link))
  infobox_table = infobox_table_tags[0]

  def is_coordinates_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Coordinates")

  coordinates_tags = infobox_table.find_all(is_coordinates_tr)
  if len(coordinates_tags) > 1:
    raise ValueError(
        "Found more than one coordinates row in the infobox for {}".format(
            wiki_page_link))
  coordinates = coordinates_tags[0]

  coordinates_text = coordinates.find(**{"class": "geo"}).contents[0]
  lat_text, long_text = coordinates_text.split("; ")

  def is_elevation_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Elevation")

  elevation_tags = infobox_table.find_all(is_elevation_tr)
  if len(elevation_tags) > 1:
    raise ValueError(
        "Found more than one elevation row in the infobox for {}".format(
            wiki_page_link))
  elevation_tag = elevation_tags[0]
  elevation_text = elevation_tag.find(**{"class": "infobox-data"}).get_text()
  elevation_match = re.search(r"\(([\d,]+)[\+]?\s+m\)", elevation_text)
  elevation = float(elevation_match.group(1).replace(',', ''))

  return (float(long_text), float(lat_text), elevation)


# Given parsed sparql info about a mountain, returns the (long, lat, elevation)
# for that mountain, either sourced directly from the sparql data or the
# scraped wikipedia page.
def get_location(parsed: Dict[Text, Any]) -> Tuple[float, float, float]:
  if ("http://www.w3.org/2003/01/geo/wgs84_pos#long" in parsed and
      "http://www.w3.org/2003/01/geo/wgs84_pos#lat" in parsed and
      "http://dbpedia.org/ontology/elevation" in parsed):
    return (parsed["http://www.w3.org/2003/01/geo/wgs84_pos#long"],
            parsed["http://www.w3.org/2003/01/geo/wgs84_pos#lat"],
            parsed["http://dbpedia.org/ontology/elevation"])

  return scrape_location_from_wikipedia(parsed)


# Given a URI, retrieves mountain data from DBPedia and elsewhere.
# Returns it in a nice-ish dictionary.
def get_mountain(uri: Text) -> Dict[Text, Any]:
  sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
  sparql.setQuery("describe <{}>".format(uri))
  sparql.setReturnFormat(SPARQLWrapper.JSON)
  result = sparql.query().convert()
  parsed = parse_sparql_mountain(result)
  location = get_location(parsed)
  return {
      "uri": uri,
      "name": parsed["http://xmlns.com/foaf/0.1/name"],
      "location": {
          "long": location[0],
          "lat": location[1],
          "elevation": location[2],
      },
      "raw_parsed": parsed
  }


def get_mountains(n: int) -> Generator[Dict[Text, Any], None, None]:
  offset = 0
  base_query = "select * {?mountain a dbo:Mountain}"
  while offset < n or n < 0:
    limit = FLAGS.sparql_page_size
    if n >= 0:
      limit = min(limit, n - offset)
    query = "{} LIMIT {} OFFSET {}".format(base_query, limit, offset)
    logging.info("Querying: %s", query)

    sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
    sparql.setQuery(query)
    sparql.setReturnFormat(SPARQLWrapper.JSON)
    results = sparql.query().convert()

    bindings = results["results"]["bindings"]
    if len(bindings) == 0:
      return
    for result in bindings:
      uri = result["mountain"]["value"]
      yield get_mountain(uri)

    offset += FLAGS.sparql_page_size


def search_by_name(name: Text) -> Text:
  sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
  query = """
        select * {{
            ?mountain a dbo:Mountain .
            ?mountain dbp:name ?name .
            filter contains(str(?name), "{}")
        }}
    """.format(name)
  sparql.setQuery(query)
  sparql.setReturnFormat(SPARQLWrapper.JSON)
  result = sparql.query().convert()

  uris = [
      binding["mountain"]["value"] for binding in result["results"]["bindings"]
  ]

  if len(uris) == 1:
    return uris[0]

  questions = [inquirer.List("uri", message="Which one?", choices=uris)]
  answers = inquirer.prompt(questions)
  return answers["uri"]


def main(argv):
  if FLAGS.db == 'postgres':
    db = PostgresDB(FLAGS.postgres_db, FLAGS.postgres_username)
  elif FLAGS.db == 'sequelize':
    db = SequelizeDB()
  elif FLAGS.db == 'log':
    db = LogDB(FLAGS.log_raw_parsed)

  if FLAGS.name:
    uri = search_by_name(FLAGS.name)
    db.insert_mountain(get_mountain(uri))
    return

  if FLAGS.uri:
    db.insert_mountain(get_mountain(FLAGS.uri))
    return

  for mountain in get_mountains(FLAGS.n):
    db.insert_mountain(mountain)


if __name__ == "__main__":
  app.run(main)
