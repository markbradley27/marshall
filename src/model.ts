// This is kind of gross, but Sequelize doesn't play nice with Typescript...
// tslint:disable max-classes-per-file
//
// TODO: Currently all geography types are declared as 'any'.
// DataTypes.GeographyDataType seems like the thing to use instead, but that
// doesn't seem to work...

import {
  Association,
  BelongsToCreateAssociationMixin,
  BelongsToGetAssociationMixin,
  BelongsToSetAssociationMixin,
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyHasAssociationsMixin,
  HasManyRemoveAssociationMixin,
  HasManyRemoveAssociationsMixin,
  HasManySetAssociationsMixin,
  Model,
  Optional,
  Sequelize,
} from "sequelize";
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

interface ActivityAttributes {
  id: number;
  source: string;
  sourceId: string;
  name: string;
  date: Date;
  path: any;
  description: string;
}

interface ActivityCreationAttributes
  extends Optional<ActivityAttributes, "id" | "sourceId" | "description"> {}

class Activity
  extends Model<ActivityAttributes, ActivityCreationAttributes>
  implements ActivityAttributes
{
  id!: number;
  source!: string;
  sourceId!: string;
  name!: string;
  date!: Date;
  path!: any;
  description!: string;

  createdAt!: Date;
  updatedAt!: Date;

  addAscent!: HasManyAddAssociationMixin<Ascent, number>;
  addAscents!: HasManyAddAssociationsMixin<Ascent, number>;
  countAscents!: HasManyCountAssociationsMixin;
  createAscent!: HasManyCreateAssociationMixin<Ascent>;
  getAscents!: HasManyGetAssociationsMixin<Ascent>;
  hasAscent!: HasManyHasAssociationMixin<Ascent, number>;
  hasAscents!: HasManyHasAssociationsMixin<Ascent, number>;
  removeAscent!: HasManyRemoveAssociationMixin<Ascent, number>;
  removeAscents!: HasManyRemoveAssociationsMixin<Ascent, number>;
  setAscents!: HasManySetAssociationsMixin<Ascent, number>;

  getUser!: BelongsToGetAssociationMixin<User>;
  setUser!: BelongsToSetAssociationMixin<User, number>;
  createUser!: BelongsToCreateAssociationMixin<User>;

  readonly ascents?: Ascent[];
  readonly user?: User;

  static associations: {
    ascents: Association<Activity, Ascent>;
    user: Association<Activity, User>;
  };
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // TODO: Think about how to encode this a bit more, string is a lazy
    // choice.
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sourceId: DataTypes.STRING,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    path: {
      type: DataTypes.GEOGRAPHY("LINESTRING"),
      allowNull: false,
    },
    description: DataTypes.STRING,
  },
  {
    hooks: {
      afterCreate: async (activity, options) => {
        const user = await activity.getUser();

        const mountainsAscended = await Mountain.findAll({
          where: Sequelize.where(
            Sequelize.fn(
              "ST_DWithin",
              Sequelize.col("location"),
              Sequelize.cast(
                Sequelize.fn(
                  "ST_GeomFromGeoJSON",
                  JSON.stringify(activity.path)
                ),
                "geography"
              ),
              25
            ),
            "true"
          ),
        });

        await Ascent.bulkCreate(
          mountainsAscended.map((mountain) => {
            return {
              date: activity.date,
              ActivityId: activity.id,
              MountainId: mountain.id,
              UserId: user.id,
            };
          })
        );
      },
    },
    sequelize,
  }
);

interface AscentAttributes {
  id: number;
  date: Date;
}

interface AscentCreationAttributes extends Optional<AscentAttributes, "id"> {}

class Ascent
  extends Model<AscentAttributes, AscentCreationAttributes>
  implements AscentAttributes
{
  id!: number;
  date!: Date;

  createdAt!: Date;
  updatedAt!: Date;

  getMountain!: BelongsToGetAssociationMixin<Mountain>;
  setMountain!: BelongsToSetAssociationMixin<Mountain, number>;
  createMountain!: BelongsToCreateAssociationMixin<Mountain>;

  getUser!: BelongsToGetAssociationMixin<User>;
  setUser!: BelongsToSetAssociationMixin<User, number>;
  createUser!: BelongsToCreateAssociationMixin<User>;

  readonly mountain?: Mountain;
  readonly user?: User;

  static associations: {
    mountain: Association<Ascent, Mountain>;
    user: Association<Ascent, User>;
  };
}

Ascent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { sequelize }
);

interface MountainAttributes {
  id: number;
  source: string;
  name: string;
  location: any;
  description: string;
}

interface MountainCreationAttributes
  extends Optional<MountainAttributes, "id" | "description"> {}

class Mountain
  extends Model<MountainAttributes, MountainCreationAttributes>
  implements MountainAttributes
{
  id!: number;
  source!: string;
  name!: string;
  location!: any;
  description!: string;

  createdAt!: Date;
  updatedAt!: Date;

  addAscent!: HasManyAddAssociationMixin<Ascent, number>;
  addAscents!: HasManyAddAssociationsMixin<Ascent, number>;
  countAscents!: HasManyCountAssociationsMixin;
  createAscent!: HasManyCreateAssociationMixin<Ascent>;
  getAscents!: HasManyGetAssociationsMixin<Ascent>;
  hasAscent!: HasManyHasAssociationMixin<Ascent, number>;
  hasAscents!: HasManyHasAssociationsMixin<Ascent, number>;
  removeAscent!: HasManyRemoveAssociationMixin<Ascent, number>;
  removeAscents!: HasManyRemoveAssociationsMixin<Ascent, number>;
  setAscents!: HasManySetAssociationsMixin<Ascent, number>;

  readonly ascents?: Ascent[];

  static associations: {
    ascents: Association<Mountain, Ascent>;
  };
}

Mountain.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.GEOGRAPHY("POINTZ"),
      allowNull: false,
    },
    description: DataTypes.STRING,
  },
  { sequelize }
);

interface UserAttributes {
  id: string;
  name: string;
  stravaAccessToken: string;
  stravaRefreshToken: string;
  stravaAccessTokenExpiresAt: Date;
  stravaAthleteId: number;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "stravaAccessToken"
    | "stravaRefreshToken"
    | "stravaAccessTokenExpiresAt"
    | "stravaAthleteId"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  id!: string;
  name!: string;
  stravaAccessToken!: string;
  stravaRefreshToken!: string;
  stravaAccessTokenExpiresAt!: Date;
  stravaAthleteId!: number;

  createdAt!: Date;
  updatedAt!: Date;

  addActivity!: HasManyAddAssociationMixin<Activity, number>;
  addActivities!: HasManyAddAssociationsMixin<Activity, number>;
  countActivitys!: HasManyCountAssociationsMixin;
  createActivity!: HasManyCreateAssociationMixin<Activity>;
  getActivities!: HasManyGetAssociationsMixin<Activity>;
  hasActivity!: HasManyHasAssociationMixin<Activity, number>;
  hasActivities!: HasManyHasAssociationsMixin<Activity, number>;
  removeActivity!: HasManyRemoveAssociationMixin<Activity, number>;
  removeActivities!: HasManyRemoveAssociationsMixin<Activity, number>;
  setActivities!: HasManySetAssociationsMixin<Activity, number>;

  addAscent!: HasManyAddAssociationMixin<Ascent, number>;
  addAscents!: HasManyAddAssociationsMixin<Ascent, number>;
  countAscents!: HasManyCountAssociationsMixin;
  createAscent!: HasManyCreateAssociationMixin<Ascent>;
  getAscents!: HasManyGetAssociationsMixin<Ascent>;
  hasAscent!: HasManyHasAssociationMixin<Ascent, number>;
  hasAscents!: HasManyHasAssociationsMixin<Ascent, number>;
  removeAscent!: HasManyRemoveAssociationMixin<Ascent, number>;
  removeAscents!: HasManyRemoveAssociationsMixin<Ascent, number>;
  setAscents!: HasManySetAssociationsMixin<Ascent, number>;

  readonly activities?: Activity[];
  readonly ascents?: Ascent[];

  static associations: {
    activities: Association<User, Activity>;
    ascents: Association<User, Ascent>;
  };
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    stravaAccessToken: DataTypes.STRING,
    stravaRefreshToken: DataTypes.STRING,
    stravaAccessTokenExpiresAt: DataTypes.DATE,
    stravaAthleteId: DataTypes.INTEGER,
  },
  { sequelize }
);

// Associations
Activity.hasMany(Ascent, { onDelete: "CASCADE" });
Ascent.belongsTo(Activity);

Activity.belongsTo(User);
User.hasMany(Activity, { onDelete: "CASCADE" });

Ascent.belongsTo(Mountain);
Mountain.hasMany(Ascent, { onDelete: "CASCADE" });

Ascent.belongsTo(User);
User.hasMany(Ascent, { onDelete: "CASCADE" });

// DB Initialization
// TODO: Eventually, I probably shouldn't call this every single time.
sequelize.query("CREATE EXTENSION IF NOT EXISTS postgis", { raw: true });
sequelize.sync();

export { sequelize, Activity, Ascent, Mountain, User };
