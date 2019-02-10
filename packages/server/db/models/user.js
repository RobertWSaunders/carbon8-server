const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        primaryKey: true,
        type: DataTypes.STRING,
        defaultValue: DataTypes.UUIDV4,
        validate: {
          isUUID: 4
        }
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        },
        set(val) {
          this.setDataValue(
            "firstName",
            val.charAt(0).toUpperCase() + val.slice(1)
          );
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        },
        set(val) {
          this.setDataValue(
            "lastName",
            val.charAt(0).toUpperCase() + val.slice(1)
          );
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          isLowercase: true,
          set(val) {
            this.setDataValue("email", val.toLowerCase());
          }
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [8, 128]
        }
      },
      resetPasswordHash: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      resetPasswordHashExpiryDate: {
        type: DataTypes.DATE,
        validate: {
          notEmpty: true
        }
      },
      scanCode: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      subscribed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        validate: {
          notEmpty: true
        }
      },
      admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    },
    {
      getterMethods: {
        fullName() {
          return `${this.firstName} ${this.lastName}`;
        }
      },
      setterMethods: {
        fullName(value) {
          const names = value.split(" ");
          this.setDataValue("firstName", names.slice(0, -1).join(" "));
          this.setDataValue("lastName", names.slice(-1).join(" "));
        }
      },
      indexes: [
        {
          fields: ["email", "scanCode"],
          unique: true
        }
      ]
    }
  );

  User.prototype.validPassword = function(password) {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, this.password, (err, valid) => {
        if (err || !valid) return reject();
        return resolve();
      });
    });
  };

  User.prototype.hashPassword = function() {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) return reject(err);

        bcrypt.hash(this.password, salt, (err, hash) => {
          if (err) return reject(err);

          this.password = hash;

          return resolve();
        });
      });
    });
  };

  User.addHook("beforeCreate", (user) => user.hashPassword());

  User.addHook("beforeBulkCreate", (users) =>
    Promise.all(users.map((user) => user.hashPassword()))
  );

  User.addHook("beforeUpdate", async (user, _) => {
    if (user.changed("password")) {
      return user.hashPassword();
    }
  });

  User.authenticate = function(email, password) {
    return new Promise((resolve, reject) => {
      this.findOne({ where: { email } }).then((user) => {
        if (!user) {
          return reject("Could not find a user with that email!");
        }

        user
          .validPassword(password)
          .then(() => resolve(user))
          .catch(() => reject("The credentials provided are invalid!"));
      });
    });
  };

  User.associate = ({ Fountain, UserWaterIntake, HydrationGoal }) => {
    User.hasMany(HydrationGoal, {
      foreignKey: "userId"
    });

    User.belongsToMany(Fountain, {
      through: UserWaterIntake,
      foreignKey: { name: "userId", allowNull: false },
      otherKey: { name: "fountainId", allowNull: true }
    });
  };

  return User;
};
