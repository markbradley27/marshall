import { DataTypes, Model, Sequelize } from "sequelize";

function exportAscent(sequelize: Sequelize) {
  class Ascent extends Model {}

  Ascent.init(
    {
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    { sequelize }
  );
}

export default exportAscent;
