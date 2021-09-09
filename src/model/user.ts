import { DataTypes, Model, Sequelize } from "sequelize";

function exportUser(sequelize: Sequelize) {
  class User extends Model {}

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    { sequelize }
  );
}

export default exportUser;
