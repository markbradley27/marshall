import dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import got from "got";

import { Logger } from "tslog";

const logger: Logger = new Logger();

const SUBSCRIPTION_URL = "https://www.strava.com/api/v3/push_subscriptions";

const program = new Command();
program
  .option("-vs --view_subscription", "logs subscription details")
  .option(
    "-ds --delete_subscription",
    "deletes a strava subscription if it exists"
  )
  .parse(process.argv);
const options = program.opts();

async function getSubscription() {
  const listUrl = new URL(SUBSCRIPTION_URL);
  listUrl.searchParams.append("client_id", process.env.STRAVA_CLIENT_ID);
  listUrl.searchParams.append(
    "client_secret",
    process.env.STRAVA_CLIENT_SECRET
  );

  const viewRes = await got(listUrl, { responseType: "json" });
  const subscriptions = viewRes.body as Object[];
  return subscriptions[0];
}

async function viewSubscription() {
  const subscription = await getSubscription();
  logger.info(subscription);
}

async function deleteSubscription() {
  const subscription = (await getSubscription()) as any;
  logger.info("Deleting subscription:", subscription);

  const deleteUrl = new URL(SUBSCRIPTION_URL + "/" + subscription.id);
  deleteUrl.searchParams.append("id", subscription.id);
  deleteUrl.searchParams.append("client_id", process.env.STRAVA_CLIENT_ID);
  deleteUrl.searchParams.append(
    "client_secret",
    process.env.STRAVA_CLIENT_SECRET
  );
  got.delete(deleteUrl);
  logger.info("Done.");
}

async function main() {
  if (options.view_subscription) {
    return await viewSubscription();
  }
  if (options.delete_subscription) {
    return await deleteSubscription();
  }
  logger.info("Nothing to do...");
}

main();
