  //create a connection to MySQL using Sequelize
// This code connects to a MySQL database using Sequelize ORM.  
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('badmintonshop2', 'root', '', {
  host: 'localhost',
  port: 3306,
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});


sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Kết nối thành công tới MySQL (Laragon)');
  })
  .catch((error) => {
    console.error('❌ Lỗi kết nối CSDL:', error);
  });

module.exports = sequelize;
