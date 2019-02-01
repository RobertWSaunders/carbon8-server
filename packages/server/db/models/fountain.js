module.exports = (sequelize, DataTypes) => {
  const Fountain = sequelize.define("Fountain", {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        isUUID: 4
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    }
  });

  Fountain.associate = ({ User, FountainDispense }) => {
    Fountain.belongsToMany(User, {
      through: FountainDispense,
      foreignKey: { name: "fountainId", allowNull: false },
      otherKey: { name: "userId", allowNull: false }
    });
  };

  return Fountain;
};
