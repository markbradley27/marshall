#! /usr/bin/env python3

from absl import app
from absl import flags
from absl import logging
import collections
import json
import os
import requests
from typing import Set, Text
import urllib

_EXPECTED_SPEC_URL_PREFIX = "https://developers.strava.com/swagger/"

FLAGS = flags.FLAGS

flags.DEFINE_string("spec",
                    "https://developers.strava.com/swagger/swagger.json",
                    "Url for top-level spec definition json.")
flags.DEFINE_string("output_dir", "./strava_spec", "Output directory.")


def process_spec_file(spec_path: Text, output_dir: Text) -> Set[Text]:
  logging.info("Processing: %s", spec_path)
  spec = requests.get(spec_path)
  to_process = set()

  def handle_all_refs(d):
    for k, v in d.items():
      if type(v) is dict:
        handle_all_refs(v)
        continue
      # This is a bit hacky, wouldn't handle lists of lists of dicts, but I
      # think that might be okay.
      if type(v) is list:
        for li in v:
          if type(li) is dict:
            handle_all_refs(li)

      if k == "$ref":
        # Skip local references
        if v.startswith("#"):
          logging.info("Skipping local reference: %s", v)
          continue
        if not v.startswith(_EXPECTED_SPEC_URL_PREFIX):
          raise ValueError("Ref doesn't start with expected url: {}".format(v))
        to_process.add(urllib.parse.urldefrag(v).url)
        d[k] = v[len(_EXPECTED_SPEC_URL_PREFIX):]

  spec = spec.json()
  handle_all_refs(spec)

  output_path = urllib.parse.urlparse(spec_path).path[len("/swagger/"):]
  with open(os.path.join(output_dir, output_path), "w") as file:
    file.write(json.dumps(spec, indent=2))

  return to_process


def main(argv):
  spec_queue = collections.deque((FLAGS.spec,))
  processed_specs = set()
  while True:
    try:
      current_spec = spec_queue.popleft()
      to_process = process_spec_file(current_spec, FLAGS.output_dir)
      processed_specs.add(current_spec)
      for spec in to_process:
        if spec not in processed_specs:
          spec_queue.append(spec)
        else:
          logging.info("Already processed (skipping): %s", spec)
    except IndexError:
      break


if __name__ == "__main__":
  app.run(main)
