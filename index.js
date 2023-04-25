// https://sequelize.org/docs/v6/getting-started/

const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("arq_sw_mysql", "root", "root", {
  host: "localhost",
  /* one of 'mysql' | 'postgres' | 'mssql' */
  dialect: "mysql",
  port: 3307, // default is 3306
});

async function connect() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    const User = sequelize.define("user", {
      name: {
        // https://sequelize.org/docs/v6/core-concepts/model-basics/#data-types
        type: DataTypes.STRING(50),
        get() {
          const rawValue = this.getDataValue("name");
          return rawValue ? rawValue.toUpperCase() : null;
        },
        // validacion built-in.
        validate: {
          len: {
            args: 3,
            msg: "name must have at least 3 characters",
          },
          // validacion custom.
          fn: (val) => {
            if (val.indexOf("-") != -1)
              throw new Error("name cannot contain character -");
          },
        },
        //constraint
        allowNull: false,
      },
      surname: DataTypes.STRING(50),
      email: {
        type: DataTypes.STRING(100),
        set(value) {
          this.setDataValue("email", value.toLowerCase());
        },
        // validacion built-in.
        validate: {
          isEmail: true,
        },
        //constraint
        unique: true,
      },
    });

    const Log = sequelize.define("log", {
      log: {
        type: DataTypes.STRING(100),
      },
    });
    // https://sequelize.org/docs/v6/core-concepts/assocs/
    Log.belongsTo(User);

    (async () => {
      // sincronizar los modelos definidos en la aplicación con la base de datos, 
      // lo que significa que se crearán las tablas correspondientes y se actualizarán si es necesario. 
      // El parámetro opcional "{ force: true }" indica que se deben eliminar las tablas existentes y recrearlas desde cero.
      await sequelize.sync({ force: true });
      //crear instancia de modelo, guardar y actualizar valor
      try {
        const usr = User.build({
          name: "Ana",
          surname: "Castillo",
          email: "ana@gmail.com",
        });
        //create.
        await usr.save();
        usr.name = "Juan";
        //update.
        await usr.save();

        const usr2 = await User.create({
          name: "Pedro",
          surname: "Perez",
          email: "pedro@gmail.com",
        });

        await Log.create({ log: "login 1", userId: usr2.id });
        await Log.create({ log: "login 2", userId: usr2.id });
        
        //transacciones
        sequelize.transaction(async (t) => {
          const usr3 = await User.create({
            nombre: 'Juan',
            email: 'juan@example.com',
            contraseña: '123456'
          }, { transaction: t });

          await usr3.update({ contraseña: 'nuevacontraseña' }, { transaction: t });
        }).then(() => {
          console.log('Transaction completed!');
        }).catch(error => {
          console.log('Transaction error:', error);
        });

        //consultas (queries)
        // https://sequelize.org/docs/v6/core-concepts/model-querying-finders/
        // https://sequelize.org/docs/v6/advanced-association-concepts/eager-loading/
        const logs = await Log.findAll({ include: User });

        logs.forEach((log) => {
          console.log("logs =>", log.toJSON());
        });

        const log = await Log.findOne({ 
          where: {
            id: 1
          },
          include: {
            model: User,
            attributes: ['email']
          }          
        });
        console.log("log =>", log.toJSON());
      } catch (e) {
        console.log("Error =>", e.message);
      }

      //obtener todos los usuarios
      let users = await User.findAll();
      users.forEach((user) => {
        console.log(user.toJSON());
      });

      // obtener un usuario por param
      users = await User.findAll({
        where: {
          name: "pedro",
        },
      });
      users.forEach((user) => {
        console.log(user.toJSON());
      });
    })();
  } catch (error) {
    console.error("Hubo un error", error);
  }
}

connect();
