//create a connection to MySQL using Sequelize
// This code connects to a MySQL database using Sequelize ORM.  
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('badmintonshop', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, 
});


sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Kết nối thành công tới MySQL (XAMPP)');
  })
  .catch((error) => {
    console.error('❌ Lỗi kết nối CSDL:', error);
  });

module.exports = sequelize;
