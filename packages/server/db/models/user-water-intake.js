module.exports = (sequelize, DataTypes) => {
  const UserWaterIntake = sequelize.define("UserWaterIntake", {
    intakeWaterType: {
      type: DataTypes.ENUM("SPARKLING", "FLAT"),
      allowNull: false
    },
    intakeAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    intakeDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    },
    intakeSource: {
      type: DataTypes.ENUM("FOUNTAIN", "MANUAL"),
      allowNull: false
    }
  });

  return UserWaterIntake;
};
