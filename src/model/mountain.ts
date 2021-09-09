import { DataTypes, Model, Sequelize } from "sequelize";

function exportMountain(sequelize: Sequelize) {
  class Mountain extends Model {}

  Mountain.init(
    {
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
}

export default exportMountain;
