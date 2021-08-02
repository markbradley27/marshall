#! /usr/bin/env python3

# TODO: Pytype annotations.

from absl import app
from absl import flags
from absl import logging
import json
import pymongo
import SPARQLWrapper

FLAGS = flags.FLAGS

flags.DEFINE_string('uri', '', 'URI of mountain to insert (-n is ignored if this is specified).')
flags.DEFINE_integer('n', 1, 'Number of mountains to retrieve (anything less than 0 retrieves all).')
flags.DEFINE_integer('sparql_page_size', 100, 'Max number of mountain URIs to retrieve at once.')
flags.DEFINE_string('mongodb_endpoint', '127.0.0.1', 'Endpoint of the mongodb server to populate.')
flags.DEFINE_string('mongodb_db', 'marshall', 'DB name to populate.')
flags.DEFINE_string('mongodb_collection', 'mountains', 'DB collection to populate.')

_DBPEDIA_SPARQL_ENDPOINT = "http://dbpedia.org/sparql"

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

def insert_mountain(collection, uri, mountain):
    logging.info("Inserting: {}".format(uri))
    mountain["_id"] = uri
    collection.insert_one(mountain)

def main(argv):
    mongo_client = pymongo.MongoClient(FLAGS.mongodb_endpoint)
    db = mongo_client[FLAGS.mongodb_db]
    collection = db[FLAGS.mongodb_collection]

    if FLAGS.uri:
        insert_mountain(collection, FLAGS.uri, get_mountain(FLAGS.uri))
        return

    for uri, mountain in get_mountains(FLAGS.n):
        insert_mountain(collection, uri, mountain)

if __name__ == "__main__":
   app.run(main)