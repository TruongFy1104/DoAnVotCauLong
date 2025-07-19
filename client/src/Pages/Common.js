// common.js

/**
 * Chuyển đổi thời gian từ định dạng ISO 8601 thành giờ:phút:giây ngày/tháng/năm
 * @param {string} isoDateString - Chuỗi thời gian ISO 8601 (ví dụ: "2024-12-26T05:22:19.000Z")
 * @returns {string} - Thời gian đã được định dạng
 */
export const formatDate = (isoDateString) => {
    const date = new Date(isoDateString);
  
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
  
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = date.getFullYear();
  
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };


  export const checkAccount = (res) => {
    if(!res.ok){
      if (res.status === 403) {
        alert("Bạn không có quyền truy cập vào đường dẫn này.");
        window.location.href = "/home"; // Điều hướng tới trang đăng nhập
        return; // Ngăn không tiếp tục
    } else if (res.status === 401) {
        alert("Vui lòng đăng nhập để tiếp tục.");
        window.location.href = "/login"; // Điều hướng tới trang đăng nhập
        return;
    }
    }
  
  };


  export const decodeJWT = (token) => {
    // Token JWT gồm 3 phần: header.payload.signature
    const payload = token.split('.')[1]; // Lấy phần Payload (phần giữa)
    
    // Giải mã Base64Url (thay thế '-' thành '+' và '_' thành '/')
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  
    // Chuyển kết quả thành đối tượng JSON
    return JSON.parse(decodedPayload);
  };
  
  