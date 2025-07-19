function RandomNumber(length) {
  // Kiểm tra nếu length > 0 để tránh lỗi
  if (length <= 0) {
    throw new Error('Length must be greater than 0');
  }

  // Tạo một số ngẫu nhiên có độ dài theo 'length'
  let min = Math.pow(10, length - 1);
  let max = Math.pow(10, length) - 1;
  let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomNumber;
}

module.exports = { RandomNumber };
