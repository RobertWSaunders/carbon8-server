module.exports = (sequelize, DataTypes) => {
  const HydrationGoal = sequelize.define("HydrationGoal", {
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
    goalType: {
      type: DataTypes.ENUM("DAILY", "WEEKLY", "MONTHLY", "DEADLINE"),
      allowNull: false
    },
    intakeGoal: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    goalDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  HydrationGoal.associate = ({ User }) => {
    HydrationGoal.belongsTo(User, {
      foreignKey: "userId"
    });
  };

  return HydrationGoal;
};
