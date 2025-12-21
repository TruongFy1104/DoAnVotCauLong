// filepath: [index.js](http://_vscodecontentref_/2)
const Account = require('./Account');
const ChatRoom = require('./ChatRoom');
const ChatMessage = require('./ChatMessage');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Product = require('./Product');
const Customer = require('./Customer');
const OrderStatus = require('./OrderStatus');

// Setup associations
// Order associations
Order.belongsTo(Customer, {
  foreignKey: 'CustomerId',
  as: 'Customer'
});

Order.hasMany(OrderDetail, {
  foreignKey: 'OrderId',
  as: 'OrderDetails'
});

// OrderDetail associations
OrderDetail.belongsTo(Order, { 
  foreignKey: 'OrderId' 
});

OrderDetail.belongsTo(Product, { 
  foreignKey: 'ProductId' 
});

const models = { 
  Account, 
  ChatRoom, 
  ChatMessage,
  Order,
  OrderDetail,
  Product,
  Customer,
  OrderStatus
};

// Gọi associate nếu có
Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

module.exports = models;