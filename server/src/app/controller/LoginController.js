const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const  Account  = require('../models/Account'); // Đảm bảo import đúng model của bạn
const Customer = require('../models/Customer')
const common = require('../../Common/Common')
const HashService = require('../../Common/Hashpassword');
// Mã hóa thông tin người dùng vào JWT
const SECRET_KEY = 'saddasdasadsasdadsas';  // Sử dụng khóa bí mật để mã hóa token

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    // Tìm thông tin người dùng trong cơ sở dữ liệu theo username
    const user = await Account.findOne({ where: { Username: username } });

    if (!user) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

  
    // Kiểm tra tài khoản có bị khóa không
    if (user.IsBanned === 1) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị khóa. Bạn không thể đăng nhập và sử dụng các tính năng yêu cầu đăng nhập.',
        canBrowse: true,
        contactInfo: {
          email: 'ngfitruong1104@gmail.com',
          phone: '0343439444',
          note: 'Bạn vẫn có thể xem trang web như khách. Để mở khóa tài khoản, vui lòng liên hệ quản trị viên.'
        }
      });
    }

    // Kiểm tra loại hash: bcrypt hoặc SHA256
    let isPasswordValid = false;
    
    if (user.Password.startsWith('$2b$') || user.Password.startsWith('$2a$')) {
      // Password được hash bằng bcrypt
      console.log('Hash type: bcrypt');
      isPasswordValid = await bcrypt.compare(password, user.Password);
    } else {
      // Password được hash bằng SHA256 (hệ thống cũ)
      console.log('Hash type: SHA256 (old system)');
      const sha256Hash = HashService.hashSHA256(password);
      isPasswordValid = (sha256Hash === user.Password);
      
      // Nếu đăng nhập thành công với SHA256, tự động upgrade lên bcrypt
      if (isPasswordValid) {
        console.log('Auto-upgrading password to bcrypt...');
        const bcryptHash = await bcrypt.hash(password, 10);
        user.Password = bcryptHash;
        await user.save();
        console.log('Password upgraded to bcrypt successfully');
      }
    }
    
    console.log('Password valid?', isPasswordValid);
    console.log('=== END DEBUG ===');

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    //  JWT token
    const token = jwt.sign(
      {
        username: user.Username,
        userId: user.AccountId,
        idgroup: user.IdGroup,
        email: user.Email,
        mobile: user.Mobile,
        address: user.Address,
        firstname: user.Firstname,
        lastname: user.Lastname,
        gender: user.Gender,
        customerid: user.CustomerId
      },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Đăng nhập thành công',
      token: token,
      user: {
        id: user.AccountId,
        username: user.Username,
        idgroup: user.IdGroup,
        email: user.Email,
        mobile: user.Mobile,
        address: user.Address,
        firstname: user.Firstname,
        lastname: user.Lastname,
        gender: user.Gender,
        customerid: user.CustomerId
      },
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập:', error);
    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
  }
};

exports.register = async (req, res) => {
  const { username, password, firstname, lastname, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = await Customer.create({
      Firstname: firstname,
      Lastname: lastname,
      Email: email,
      Address: '',
      Mobile: ''
    });
    const newUser = await Account.create({
      AccountId:common.RandomNumber(10),
      Username: username,
      Password: hashedPassword,
      Firstname: firstname,
      Lastname: lastname,
      Email: email,
      Mobile: '',
      Address: '',
      IdGroup: 2,
      Gender: 'Nam',
      CustomerId: newCustomer.CustomerId
    });
    return res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: newUser.AccountId,
        username: newUser.Username,
        email: newUser.Email,
      },
      token: jwt.sign(
        { username: newUser.Username, 
          userId: newUser.AccountId, 
          idgroup: newUser.IdGroup,
          email: newUser.Email,
          mobile: newUser.Mobile,
          address: newUser.Address,
          firstname: newUser.Firstname,
          lastname: newUser.Lastname,
          gender: newUser.Gender,
          customerid: newUser.CustomerId
         },
        SECRET_KEY, 
        { expiresIn: '7d' }
      ),
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
  }
};
