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
import retry
import requests
import SPARQLWrapper
import subprocess
from typing import Any, Dict, Generator, List, Optional, Text

FLAGS = flags.FLAGS

flags.DEFINE_string('name', '', 'Name of mountain to search for and insert.')
flags.DEFINE_string('uri', '', 'URI of mountain to insert.')
flags.DEFINE_boolean('adk46', False, 'Load the ADK 46 high peaks.')
flags.DEFINE_boolean('vt5', False, 'Load the Vermont 5 peaks.')
flags.DEFINE_boolean('co14ers', False, 'Load the Colorado 14ers.')

flags.DEFINE_integer(
    'n', 1,
    'Number of mountains to retrieve (anything less than 0 retrieves all, ignored if name or uri is provided).'
)
flags.DEFINE_string(
    'start_with', '',
    "If n provided, doesn't start inserting mountains until it sees this uri.")
flags.DEFINE_integer('sparql_page_size', 25,
                     'Max number of mountain URIs to retrieve at once.')

flags.DEFINE_enum(
    'db', 'sequelize', ['postgres', 'sequelize', 'log'],
    'DB type to connect to (postgres is real broke, prolly should not use it).')

flags.DEFINE_string('postgres_db', 'marshall', 'DB name to populate.')
flags.DEFINE_string('postgres_username', 'dev', 'PostgreSQL username.')

flags.DEFINE_bool(
    'log_raw_parsed', False,
    'If logging output, controls whether the raw_parsed object is logged.')

_ADK_46_URIS = (
    "http://dbpedia.org/resource/Mount_Marcy",
    "http://dbpedia.org/resource/Algonquin_Peak",
    "http://dbpedia.org/resource/Mount_Haystack",
    "http://dbpedia.org/resource/Mount_Skylight",
    "http://dbpedia.org/resource/Whiteface_Mountain",
    "http://dbpedia.org/resource/Dix_Mountain",
    "http://dbpedia.org/resource/Gray_Peak_(New_York)",
    "http://dbpedia.org/resource/Iroquois_Peak",
    "http://dbpedia.org/resource/Basin_Mountain_(New_York)",
    "http://dbpedia.org/resource/Gothics",
    "http://dbpedia.org/resource/Mount_Colden",
    "http://dbpedia.org/resource/Giant_Mountain",
    "http://dbpedia.org/resource/Nippletop",
    "http://dbpedia.org/resource/Santanoni_Peak",
    "http://dbpedia.org/resource/Mount_Redfield",
    "http://dbpedia.org/resource/Wright_Peak",
    "http://dbpedia.org/resource/Saddleback_Mountain_(Keene,_New_York)",
    "http://dbpedia.org/resource/Panther_Peak",
    "http://dbpedia.org/resource/Table_Top_Mountain_(New_York)",
    "http://dbpedia.org/resource/Rocky_Peak_Ridge",
    "http://dbpedia.org/resource/Macomb_Mountain",
    "http://dbpedia.org/resource/Armstrong_Mountain_(Keene_Valley,_New_York)",
    "http://dbpedia.org/resource/Hough_Peak",
    "http://dbpedia.org/resource/Seward_Mountain_(New_York)",
    "http://dbpedia.org/resource/Mount_Marshall_(New_York)",
    "http://dbpedia.org/resource/Allen_Mountain_(New_York)",
    "http://dbpedia.org/resource/Big_Slide_Mountain_(New_York)",
    "http://dbpedia.org/resource/Esther_Mountain",
    "http://dbpedia.org/resource/Upper_Wolfjaw_Mountain",
    "http://dbpedia.org/resource/Lower_Wolfjaw_Mountain",
    "http://dbpedia.org/resource/Street_Mountain_(New_York)",
    "http://dbpedia.org/resource/Phelps_Mountain_(New_York)",
    "http://dbpedia.org/resource/Donaldson_Mountain",
    "http://dbpedia.org/resource/Seymour_Mountain_(Franklin_County,_New_York)",
    "http://dbpedia.org/resource/Sawteeth_(New_York)",
    "http://dbpedia.org/resource/Cascade_Mountain_(New_York)",
    "http://dbpedia.org/resource/South_Dix",
    "http://dbpedia.org/resource/Porter_Mountain",
    "http://dbpedia.org/resource/Mount_Colvin",
    "http://dbpedia.org/resource/Mount_Emmons_(New_York)",
    "http://dbpedia.org/resource/Dial_Mountain",
    "http://dbpedia.org/resource/Grace_Peak",
    "http://dbpedia.org/resource/Blake_Peak",
    "http://dbpedia.org/resource/Cliff_Mountain_(New_York)",
    "http://dbpedia.org/resource/Nye_Mountain",
    "http://dbpedia.org/resource/Couchsachraga_Peak")

_VERMONT_5_URIS = ("http://dbpedia.org/resource/Mount_Mansfield",
                   "http://dbpedia.org/resource/Killington_Peak",
                   "http://dbpedia.org/resource/Camel's_Hump",
                   "http://dbpedia.org/resource/Mount_Ellen_(Vermont)",
                   "http://dbpedia.org/resource/Mount_Abraham_(Vermont)")

_COLORADO_14ERS_URIS = (
    "http://dbpedia.org/resource/Mount_Elbert",
    "http://dbpedia.org/resource/Mount_Massive",
    "http://dbpedia.org/resource/Mount_Harvard",
    "http://dbpedia.org/resource/Blanca_Peak",
    "http://dbpedia.org/resource/La_Plata_Peak",
    "http://dbpedia.org/resource/Uncompahgre_Peak",
    "http://dbpedia.org/resource/Crestone_Peak",
    "http://dbpedia.org/resource/Mount_Lincoln_(Colorado)",
    "http://dbpedia.org/resource/Castle_Peak_(Colorado)",
    "http://dbpedia.org/resource/Grays_Peak",
    "http://dbpedia.org/resource/Mount_Antero",
    "http://dbpedia.org/resource/Torreys_Peak",
    "http://dbpedia.org/resource/Quandary_Peak",
    "http://dbpedia.org/resource/Mount_Evans",
    "http://dbpedia.org/resource/Longs_Peak",
    "http://dbpedia.org/resource/Mount_Wilson_(Colorado)",
    "http://dbpedia.org/resource/Mount_Shavano",
    "http://dbpedia.org/resource/Mount_Princeton",
    "http://dbpedia.org/resource/Mount_Belford",
    "http://dbpedia.org/resource/Crestone_Needle",
    "http://dbpedia.org/resource/Mount_Yale",
    "http://dbpedia.org/resource/Mount_Bross",
    "http://dbpedia.org/resource/Kit_Carson_Peak",
    # Not sure about this one.
    "http://dbpedia.org/resource/Maroon_Bells",
    "http://dbpedia.org/resource/Tabeguache_Peak",
    "http://dbpedia.org/resource/Mount_Oxford_(Colorado)",
    "http://dbpedia.org/resource/Mount_Sneffels",
    "http://dbpedia.org/resource/Mount_Democrat",
    "http://dbpedia.org/resource/Capitol_Peak_(Colorado)",
    "http://dbpedia.org/resource/Pikes_Peak",
    "http://dbpedia.org/resource/Snowmass_Mountain",
    "http://dbpedia.org/resource/Windom_Peak",
    "http://dbpedia.org/resource/Mount_Eolus",
    "http://dbpedia.org/resource/Challenger_Point",
    "http://dbpedia.org/resource/Mount_Columbia_(Colorado)",
    "http://dbpedia.org/resource/Missouri_Mountain",
    "http://dbpedia.org/resource/Humboldt_Peak_(Colorado)",
    "http://dbpedia.org/resource/Mount_Bierstadt",
    "http://dbpedia.org/resource/Sunlight_Peak",
    "http://dbpedia.org/resource/Handies_Peak",
    "http://dbpedia.org/resource/Culebra_Peak",
    "http://dbpedia.org/resource/Ellingwood_Point",
    "http://dbpedia.org/resource/Mount_Lindsey",
    "http://dbpedia.org/resource/Little_Bear_Peak",
    "http://dbpedia.org/resource/Mount_Sherman",
    "http://dbpedia.org/resource/Redcloud_Peak",
    "http://dbpedia.org/resource/Pyramid_Peak_(Colorado)",
    "http://dbpedia.org/resource/Wilson_Peak",
    "http://dbpedia.org/resource/San_Luis_Peak",
    "http://dbpedia.org/resource/Wetterhorn_Peak",
    "http://dbpedia.org/resource/Mount_of_the_Holy_Cross",
    "http://dbpedia.org/resource/Huron_Peak",
    "http://dbpedia.org/resource/Sunshine_Peak",
)

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
    # TODO: I don't think this is working...
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


@retry.retry(tries=1, delay=1, backoff=2)
def sparql_query(query: Text) -> Dict[Text, Any]:
  logging.info("Querying: {}".format(query))
  sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
  sparql.setQuery(query)
  sparql.setReturnFormat(SPARQLWrapper.JSON)
  return sparql.query().convert()


def get_wikipedia_link(properties: Dict[Text, List[Any]]) -> Optional[Text]:
  if "http://xmlns.com/foaf/0.1/isPrimaryTopicOf" in properties:
    return properties["http://xmlns.com/foaf/0.1/isPrimaryTopicOf"][0]


def get_name(uri: Text, properties: Dict[Text, List[Any]]) -> Text:
  if "http://xmlns.com/foaf/0.1/name" in properties:
    return ", ".join(properties["http://xmlns.com/foaf/0.1/name"])

  wikipedia_link = get_wikipedia_link(properties)
  if wikipedia_link:
    return wikipedia_link.rsplit("/", 1)[-1].replace("_", " ")

  return uri.rsplit("/", 1)[-1].replace("_", " ")


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


# TODO: Doesn't handle all formats (Arayit_Mountain for example).
def scrape_coords_from_infobox(infobox) -> Dict[Text, float]:

  def is_coordinates_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Coordinates")

  coordinates_tags = infobox.find_all(is_coordinates_tr)

  for coordinates_tag in coordinates_tags:
    geo_tag = coordinates_tag.find(**{"class": "geo"})
    if geo_tag:
      contents = geo_tag.contents
      if contents:
        coordinates_text = contents[0]
        lat_text, long_text = coordinates_text.split("; ")
        return {"long": float(long_text), "lat": float(lat_text)}

  return {}


def scrape_elevation_from_inbox(infobox) -> Dict[Text, float]:

  def is_elevation_tr(tag):
    return (tag.name == "tr" and tag.th is not None and tag.th.a is not None and
            tag.th.a.contents[0] == "Elevation")

  elevation_tags = infobox.find_all(is_elevation_tr)
  for elevation_tag in elevation_tags:
    infobox_data = elevation_tag.find(**{"class": "infobox-data"})
    if infobox_data:
      elevation_text = infobox_data.get_text()
      elevation_match = re.search(r"\(([\d,]+)[\+]?\s+m\)", elevation_text)
      if elevation_match:
        elevation = float(elevation_match.group(1).replace(',', ''))
        return {"elevation": elevation}

  return {}


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
def parse_mountain_properties(
    uri: Text, properties: Dict[Text, List[Any]]) -> Dict[Text, Any]:
  logging.info("Parsing: {}".format(uri))

  name = get_name(uri, properties)

  location = get_location(properties)
  if "long" not in location or "lat" not in location or "elevation" not in location:
    logging.warn("Couldn't find full location for {}: {}".format(uri, location))
    merge_locations(location, {"long": 0, "lat": 0, "elevation": 0})

  wikipedia_link = get_wikipedia_link(properties)

  abstract = get_abstract(properties)

  mountain = {
      "uri": uri,
      "name": name,
      "location": location,
  }
  if wikipedia_link:
    mountain["wikipedia_link"] = wikipedia_link
  if abstract:
    mountain["abstract"] = abstract

  return mountain


def get_mountain(uri):
  result = sparql_query("describe <{}>".format(uri))
  parsed = parse_sparql_spo(result)
  return parse_mountain_properties(uri, parsed[uri])


def get_mountains(n: int, sparql_page_size: int,
                  start_with: Text) -> Generator[Dict[Text, Any], None, None]:
  query_template = "select * {{?mountain a dbo:Mountain}} order by(?mountain) limit {} offset {}"
  offset = 0
  need = n
  still_looking = bool(start_with)
  while need != 0:
    limit = sparql_page_size if still_looking or need < 0 else min(
        sparql_page_size, need)
    query = query_template.format(limit, offset)
    results = sparql_query(query)

    bindings = results["results"]["bindings"]
    if len(bindings) == 0:
      return

    uris = [result["mountain"]["value"] for result in bindings]
    if still_looking:
      for i, uri in enumerate(uris):
        if uri == start_with:
          still_looking = False
          uris = uris[i:][:need]
          break
        else:
          logging.info("Skipping: {}".format(uri))
      if still_looking:
        continue

    result = sparql_query("describe <{}>".format("> <".join(uris)))
    parsed = parse_sparql_spo(result)
    for uri in uris:
      yield parse_mountain_properties(uri, parsed[uri])
      if need > 0:
        need -= 1

    offset += sparql_page_size


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

  if FLAGS.adk46:
    for uri in _ADK_46_URIS:
      db.insert_mountain(get_mountain(uri))
    return

  if FLAGS.vt5:
    for uri in _VERMONT_5_URIS:
      db.insert_mountain(get_mountain(uri))
    return

  if FLAGS.co14ers:
    for uri in _COLORADO_14ERS_URIS:
      db.insert_mountain(get_mountain(uri))
    return

  for mountain in get_mountains(FLAGS.n, FLAGS.sparql_page_size,
                                FLAGS.start_with):
    db.insert_mountain(mountain)


if __name__ == "__main__":
  app.run(main)
