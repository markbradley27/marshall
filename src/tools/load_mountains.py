#! /usr/bin/env python3

# TODO: Pytype annotations.

import abc
from absl import app
from absl import flags
from absl import logging
import inquirer
import json
import psycopg2
import pymongo
import SPARQLWrapper

FLAGS = flags.FLAGS

flags.DEFINE_string('name', '', 'Name of mountain to search for and insert.')
flags.DEFINE_string('uri', '', 'URI of mountain to insert (-n is ignored if this is specified).')
flags.DEFINE_integer('n', 1, 'Number of mountains to retrieve (anything less than 0 retrieves all).')
flags.DEFINE_integer('sparql_page_size', 100, 'Max number of mountain URIs to retrieve at once.')

flags.DEFINE_enum('db', 'postgres', ['mongo', 'postgres'], 'DB type to connect to.')

flags.DEFINE_string('mongo_endpoint', '127.0.0.1', 'Endpoint of the mongodb server to populate.')
flags.DEFINE_string('mongo_db', 'marshall', 'DB name to populate.')
flags.DEFINE_string('mongo_collection', 'mountains', 'DB collection to populate.')

flags.DEFINE_string('postgres_db', 'marshall', 'DB name to populate.')
flags.DEFINE_string('postgres_username', '', 'PostgreSQL username.')

_DBPEDIA_SPARQL_ENDPOINT = "http://dbpedia.org/sparql"

class DBInterface(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    def insert_mountain(self):
        pass

class MongoDB(DBInterface):
    def __init__(self, endpoint, db_name, collection):
        self._mongo_client = pymongo.MongoClient(endpoint)
        self._db = self._mongo_client[db_name]
        self._collection = self._db[collection]

    def insert_mountain(self, uri, mountain):
        logging.info("Inserting: {}".format(uri))
        mountain["_id"] = uri
        self._collection.insert_one(mountain)

class PostgresDB(DBInterface):
    def __init__(self, db_name, username):
        self._conn = psycopg2.connect("dbname={} user={}".format(db_name, username))

    def __del__(self):
        self._conn.close()

    def insert_mountain(self, uri, mountain):
        logging.info("Inserting: {}".format(uri))
        with self._conn.cursor() as cur:
            cur.execute("INSERT INTO mountains VALUES (%s, ST_MakePoint(%s, %s, %s)::geography, %s)", (uri, mountain['http://www.w3.org/2003/01/geo/wgs84_pos#long'], mountain['http://www.w3.org/2003/01/geo/wgs84_pos#lat'], mountain['http://dbpedia.org/ontology/elevation'], json.dumps(mountain)))
            self._conn.commit()

def parse_sparql_mountain(sparql_json):
    parsed = {}
    for spo in sparql_json["results"]["bindings"]:
        parsed[spo["p"]["value"]] = spo["o"]["value"]
    return parsed

def get_mountain(uri):
    sparql = SPARQLWrapper.SPARQLWrapper(_DBPEDIA_SPARQL_ENDPOINT)
    sparql.setQuery("describe <{}>".format(uri))
    sparql.setReturnFormat(SPARQLWrapper.JSON)
    result = sparql.query().convert()
    return parse_sparql_mountain(result)

def get_mountains(n):
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
            yield uri, get_mountain(uri)

        offset += FLAGS.sparql_page_size

def search_by_name(name):
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

    uris = [binding["mountain"]["value"] for binding in result["results"]["bindings"]]

    if len(uris) == 1:
        return uris[0]
    
    questions = [inquirer.List("uri", message="Which one?", choices=uris)]
    answers = inquirer.prompt(questions)
    return answers["uri"]

def main(argv):
    if FLAGS.db == 'mongo':
        db = MongoDB(FLAGS.mongo_endpoint, FLAGS.mongo_db, FLAGS.mongo_collection)
    elif FLAGS.db == 'postgres':
        db = PostgresDB(FLAGS.postgres_db, FLAGS.postgres_username)

    if FLAGS.name:
        uri = search_by_name(FLAGS.name)
        db.insert_mountain(uri, get_mountain(uri))
        return

    if FLAGS.uri:
        db.insert_mountain(FLAGS.uri, get_mountain(FLAGS.uri))
        return

    for uri, mountain in get_mountains(FLAGS.n):
        db.insert_mountain(uri, mountain)

if __name__ == "__main__":
   app.run(main)
