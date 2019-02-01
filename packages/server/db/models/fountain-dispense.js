module.exports = (sequelize, DataTypes) => {
  const FountainDispense = sequelize.define("FountainDispense", {
    waterTypeDispensed: {
      type: DataTypes.ENUM("SPARKLING", "FLAT"),
      allowNull: false
    },
    amountDispensed: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dateDispensed: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    }
  });

  return FountainDispense;
};
