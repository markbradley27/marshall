import exportActivity from "./activity";
import exportAscent from "./ascent";
import exportMountain from "./mountain";
import exportUser from "./user";

import { Sequelize } from "sequelize";
import { Logger } from "tslog";

const logger = new Logger();

const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.PG_HOST,
  port: parseInt(process.env.PG_PORT, 10),
  username: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  logging: (msg) => logger.info(msg),
});

exportActivity(sequelize);
exportAscent(sequelize);
exportMountain(sequelize);
exportUser(sequelize);

const { Activity, Ascent, Mountain, User } = sequelize.models;

Activity.hasMany(Ascent);
Ascent.belongsTo(Activity);

Activity.belongsTo(User);
User.hasMany(Activity);

Ascent.belongsTo(Mountain);
Mountain.hasMany(Ascent);

Ascent.belongsTo(User);
User.hasMany(Ascent);

sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis", { raw: true });
sequelize.sync();

export default sequelize;
