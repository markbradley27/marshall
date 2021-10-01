#! /usr/bin/env python3

import abc
from absl import app
from absl import flags
from absl import logging
import bs4
import datetime
import inquirer
import json
import pprint
import psycopg2
import re
import requests
import SPARQLWrapper
import subprocess
from typing import Any, Dict, Generator, List, Optional, Text

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
    self.load_mountains_ts = subprocess.Popen(
        ["npx", "ts-node", "tools/load_mountains.ts"],
        stdin=subprocess.PIPE,
        encoding="utf-8")

  def __del__(self):
    self.load_mountains_ts.stdin.flush()
    self.load_mountains_ts.stdin.close()
    self.load_mountains_ts.wait()

  def insert_mountain(self, mountain: Dict[Text, Any]) -> None:
    if self.load_mountains_ts.poll():
      raise Exception("load_mountains.ts has died!")
    logging.info("Inserting via Sequelize: %s", mountain["uri"])
    self.load_mountains_ts.stdin.write("{}\r\n".format(json.dumps(mountain)))


class LogDB(DBInterface):

  def __init__(self, log_raw_parsed):
    self._log_raw_parsed = log_raw_parsed

  def insert_mountain(self, mountain: Dict[Text, Any]) -> None:
    if not self._log_raw_parsed:
      mountain["raw_parsed"] = "<redacted>"
    logging.info(json.dumps(mountain))


def sparql_query(query: Text) -> Dict[Text, Any]:
  logging.info("Querying: {}".format(query))
  sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
  sparql.setQuery(query)
  sparql.setReturnFormat(SPARQLWrapper.JSON)
  return sparql.query().convert()


def get_wikipedia_link(properties: Dict[Text, List[Any]]) -> Optional[Text]:
  if "http://xmlns.com/foaf/0.1/isPrimaryTopicOf" in properties:
    return properties["http://xmlns.com/foaf/0.1/isPrimaryTopicOf"][0]


def get_name(properties: Dict[Text, List[Any]]) -> Text:
  if "http://xmlns.com/foaf/0.1/name" in properties:
    return ", ".join(properties["http://xmlns.com/foaf/0.1/name"])

  wikipedia_link = get_wikipedia_link(properties)
  if wikipedia_link:
    return wikipedia_link.rsplit("/", 1)[-1].replace("_", " ")

  raise ValueError("Couldn't get name!")


# Takes the big awful s/p/o format spat out by sparql and turns it in to a
# { subject: { predicate: [object] }} dictionary.
def parse_sparql_spo(
    sparql_json: Dict[Text, Any]) -> Dict[Text, Dict[Text, List[Any]]]:
  parsed = {}
  for spo in sparql_json["results"]["bindings"]:
    subject = spo["s"]["value"]
    predicate = spo["p"]["value"]
    object = spo["o"]["value"]

    sDict = parsed.setdefault(subject, {})
    pList = sDict.setdefault(predicate, [])
    pList.append(object)
  return parsed


def merge_locations(dest: Dict[Text, float], source: Dict[Text, float]) -> bool:
  did_something = False
  if "long" not in dest and "long" in source:
    dest["long"] = source["long"]
    did_something = True
  if "lat" not in dest and "lat" in source:
    dest["lat"] = source["lat"]
    did_something = True
  if "elevation" not in dest and "elevation" in source:
    dest["elevation"] = source["elevation"]
    did_something = True
  return did_something


def scrape_coords_from_infobox(infobox) -> Dict[Text, float]:

  def is_coordinates_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Coordinates")

  coordinates_tags = infobox.find_all(is_coordinates_tr)
  if len(coordinates_tags) == 0:
    return {}
  if len(coordinates_tags) > 1:
    raise ValueError("Found more than one coordinates row in the infobox.")
  coordinates = coordinates_tags[0]

  coordinates_text = coordinates.find(**{"class": "geo"}).contents[0]
  lat_text, long_text = coordinates_text.split("; ")
  return {"long": float(long_text), "lat": float(lat_text)}


def scrape_elevation_from_inbox(infobox) -> Dict[Text, float]:

  def is_elevation_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Elevation")

  elevation_tags = infobox.find_all(is_elevation_tr)
  if len(elevation_tags) == 0:
    return {}
  if len(elevation_tags) > 1:
    raise ValueError("Found more than one elevation row in the infobox.")
  elevation_tag = elevation_tags[0]
  elevation_text = elevation_tag.find(**{"class": "infobox-data"}).get_text()
  elevation_match = re.search(r"\(([\d,]+)[\+]?\s+m\)", elevation_text)
  if not elevation_match:
    return {}
  elevation = float(elevation_match.group(1).replace(',', ''))
  return {"elevation": elevation}


def scrape_location_from_wikipedia(
    wikipedia_link: Text, location: Dict[Text, float]) -> Dict[Text, float]:
  wiki_page_req = requests.get(wikipedia_link)
  wiki_page = bs4.BeautifulSoup(wiki_page_req.text, "html.parser")

  def is_infobox_table(tag):
    return tag.name == "table" and "infobox" in tag.get_attribute_list("class")

  infobox_table_tags = wiki_page.find_all(is_infobox_table)
  for infobox in infobox_table_tags:
    if "long" not in location or "lat" not in location:
      infobox_location = scrape_coords_from_infobox(infobox)
      if merge_locations(
          location,
          infobox_location) and "long" in location and "lat" in location:
        break

  for infobox in infobox_table_tags:
    if "elevation" not in location:
      infobox_location = scrape_elevation_from_inbox(infobox)
      if merge_locations(location,
                         infobox_location) and "elevation" in location:
        break

  return location


# Given parsed sparql info about a mountain, returns the long, lat, and
# elevation for that mountain, either sourced directly from the sparql data or
# the scraped wikipedia page.
def get_location(properties: Dict[Text, List[Any]]) -> Dict[Text, float]:
  location = {}
  if ("http://www.w3.org/2003/01/geo/wgs84_pos#long" in properties):
    location["long"] = properties[
        "http://www.w3.org/2003/01/geo/wgs84_pos#long"][0]
  if ("http://www.w3.org/2003/01/geo/wgs84_pos#lat" in properties):
    location["lat"] = properties["http://www.w3.org/2003/01/geo/wgs84_pos#lat"][
        0]
  if ("http://dbpedia.org/ontology/elevation" in properties):
    location["elevation"] = properties["http://dbpedia.org/ontology/elevation"][
        0]
  elif ("http://dbpedia.org/ontology/elevationM" in properties):
    location["elevation"] = properties[
        "http://dbpedia.org/ontology/elevationM"][0]

  logging.info("Location from just DBPedia: {}".format(location))

  if "long" not in location or "lat" not in location or "elevation" not in location:
    wikipedia_link = get_wikipedia_link(properties)
    if wikipedia_link:
      scrape_location_from_wikipedia(wikipedia_link, location)

  return location


def get_abstract(properties: Dict[Text, List[Any]]) -> Optional[Text]:
  if "http://dbpedia.org/ontology/abstract" in properties:
    return properties["http://dbpedia.org/ontology/abstract"][0]


# Given a URI, retrieves mountain data from DBPedia and elsewhere.
# Returns it in a nice-ish dictionary.
def get_mountain(uri: Text) -> Dict[Text, Any]:
  result = sparql_query("describe <{}>".format(uri))
  parsed = parse_sparql_spo(result)

  name = get_name(parsed[uri])

  location = get_location(parsed[uri])
  if "long" not in location or "lat" not in location or "elevation" not in location:
    logging.warn("Could find full location for {}: {}".format(uri, location))
    merge_locations(location, {"long": 0, "lat": 0, "elevation": 0})

  wikipedia_link = get_wikipedia_link(parsed[uri])

  abstract = get_abstract(parsed[uri])

  mountain = {
      "uri": uri,
      "name": name,
      "location": location,
      "raw_parsed": parsed
  }
  if wikipedia_link:
    mountain["wikipedia_link"] = wikipedia_link
  if abstract:
    mountain["abstract"] = abstract

  return mountain


def get_mountains(n: int) -> Generator[Dict[Text, Any], None, None]:
  offset = 0
  base_query = "select * {?mountain a dbo:Mountain}"
  while offset < n or n < 0:
    limit = FLAGS.sparql_page_size
    if n >= 0:
      limit = min(limit, n - offset)
    query = "{} LIMIT {} OFFSET {}".format(base_query, limit, offset)
    results = sparql_query(query)

    bindings = results["results"]["bindings"]
    if len(bindings) == 0:
      return
    for result in bindings:
      uri = result["mountain"]["value"]
      logging.info("Getting: {}".format(uri))
      yield get_mountain(uri)

    offset += FLAGS.sparql_page_size


def search_by_name(name: Text) -> Text:
  query = """
        select * {{
            ?mountain a dbo:Mountain .
            ?mountain dbp:name ?name .
            filter contains(str(?name), "{}")
        }}
    """.format(name)
  result = sparql_query(query)

  uris = [
      binding["mountain"]["value"] for binding in result["results"]["bindings"]
  ]

  if len(uris) == 1:
    return uris[0]

  questions = [inquirer.List("uri", message="Which one?", choices=uris)]
  answers = inquirer.prompt(questions)
  return answers["uri"]


def main(argv):
  del argv

  db = LogDB(FLAGS.log_raw_parsed)
  if FLAGS.db == 'postgres':
    db = PostgresDB(FLAGS.postgres_db, FLAGS.postgres_username)
  elif FLAGS.db == 'sequelize':
    db = SequelizeDB()

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
