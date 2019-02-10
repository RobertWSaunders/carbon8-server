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
    },
    locationLatitude: {
      type: DataTypes.STRING,
      allowNull: true
    },
    locationLongitude: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sparklingSupported: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    needsMaintenance: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  });

  Fountain.associate = ({ User, UserWaterIntake }) => {
    Fountain.belongsToMany(User, {
      through: UserWaterIntake,
      foreignKey: { name: "fountainId", allowNull: true },
      otherKey: { name: "userId", allowNull: false }
    });
  };

  return Fountain;
};
