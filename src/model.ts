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

enum ActivitySource {
  strava = "strava",
  gpx = "gpx",
}

interface ActivityAttributes {
  id: number;
  source: ActivitySource;
  sourceId: string;
  name: string;
  date: Date;
  path: any;
  description: string;

  UserId?: string;
}

interface ActivityCreationAttributes
  extends Optional<ActivityAttributes, "id" | "sourceId" | "description"> {}

class Activity
  extends Model<ActivityAttributes, ActivityCreationAttributes>
  implements ActivityAttributes
{
  id!: number;
  source!: ActivitySource;
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

  readonly Ascents?: Ascent[];

  getUser!: BelongsToGetAssociationMixin<User>;
  setUser!: BelongsToSetAssociationMixin<User, number>;
  createUser!: BelongsToCreateAssociationMixin<User>;

  UserId!: string;
  readonly User?: User;

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
    source: {
      type: DataTypes.ENUM("strava", "gpx"),
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
              // TODO: This is pretty generous, consider narrowing it down a bit.
              //       Look at my Marshall hike and try to figure out why it
              //       thinks I was 46m away.
              50
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
    indexes: [
      {
        type: "UNIQUE",
        fields: ["source", "sourceId"],
      },
    ],
    sequelize,
  }
);

interface AscentAttributes {
  id: number;
  date: Date;

  ActivityId?: number;
  MountainId?: number;
  UserId?: string;
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

  getActivity!: BelongsToGetAssociationMixin<Activity>;
  setActivity!: BelongsToSetAssociationMixin<Activity, number>;
  createActivity!: BelongsToCreateAssociationMixin<Activity>;

  ActivityId!: number;
  readonly Activity?: Activity;

  getMountain!: BelongsToGetAssociationMixin<Mountain>;
  setMountain!: BelongsToSetAssociationMixin<Mountain, number>;
  createMountain!: BelongsToCreateAssociationMixin<Mountain>;

  MountainId!: number;
  readonly Mountain?: Mountain;

  getUser!: BelongsToGetAssociationMixin<User>;
  setUser!: BelongsToSetAssociationMixin<User, number>;
  createUser!: BelongsToCreateAssociationMixin<User>;

  UserId!: string;
  readonly User?: User;

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

enum MountainSource {
  dbpedia = "dbpedia",
}

interface MountainAttributes {
  id: number;
  source: MountainSource;
  sourceId: string;
  name: string;
  location: any;
  wikipediaLink: string;
  abstract: string;
}

interface MountainCreationAttributes
  extends Optional<
    MountainAttributes,
    "id" | "sourceId" | "wikipediaLink" | "abstract"
  > {}

class Mountain
  extends Model<MountainAttributes, MountainCreationAttributes>
  implements MountainAttributes
{
  id!: number;
  source!: MountainSource;
  sourceId!: string;
  name!: string;
  location!: any;
  wikipediaLink!: string;
  abstract!: string;

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

  readonly Ascents?: Ascent[];

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
      type: DataTypes.ENUM("dbpedia"),
      allowNull: false,
    },
    sourceId: DataTypes.STRING,
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.GEOGRAPHY("POINTZ"),
      allowNull: false,
    },
    wikipediaLink: DataTypes.STRING,
    abstract: DataTypes.TEXT,
  },
  {
    indexes: [
      {
        type: "UNIQUE",
        fields: ["source", "sourceId"],
      },
    ],
    sequelize,
  }
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

  readonly Activities?: Activity[];

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

  readonly Ascents?: Ascent[];

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

export {
  sequelize,
  Activity,
  ActivitySource,
  Ascent,
  Mountain,
  MountainSource,
  User,
};
