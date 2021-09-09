import { DataTypes, Model, Sequelize } from "sequelize";

function exportActivity(sequelize: Sequelize) {
  class Activity extends Model {}

  Activity.init(
    {
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
        type: DataTypes.GEOGRAPHY("LINESTRING"),
        allowNull: false,
      },
      description: DataTypes.STRING,
    },
    { sequelize }
  );
}

export default exportActivity;
