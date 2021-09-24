// This is kind of gross, but Sequelize doesn't play nice with Typescript...
// tslint:disable max-classes-per-file

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
  name: string;
  date: Date;
  path: DataTypes.GeographyDataType;
  description: string;
}

interface ActivityCreationAttributes
  extends Optional<ActivityAttributes, "id" | "description"> {}

class Activity
  extends Model<ActivityAttributes, ActivityCreationAttributes>
  implements ActivityAttributes
{
  id!: number;
  source!: string;
  name!: string;
  date!: Date;
  path!: DataTypes.GeographyDataType;
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

  static associations: {
    ascents: Association<User, Ascent>;
  };
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // TODO: Think about how to encode this a bit more, string is a lazy
    // choice.
    source: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    path: {
      type: DataTypes.GEOGRAPHY("LINESTRINGZ"),
      allowNull: false,
    },
    description: DataTypes.STRING,
  },
  { sequelize }
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
}

Ascent.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
  location: DataTypes.GeographyDataType;
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
  location!: DataTypes.GeographyDataType;
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
    ascents: Association<User, Ascent>;
  };
}

Mountain.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
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
  id: number;
  name: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  id!: number;
  name!: string;

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
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  { sequelize }
);

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

export { sequelize, User };