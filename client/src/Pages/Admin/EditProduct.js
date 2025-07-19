import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EditProductForm = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login'
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  // Trạng thái của các trường trong form
  const [productName, setProductName] = useState('');
  const [productImage, setProductImage] = useState(null);
  const [productSummary, setProductSummary] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [specifications, setSpecifications] = useState([{ size: '', content: '' }]);

  // Xử lý khi người dùng chọn hình ảnh
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setProductImage(URL.createObjectURL(file)); // Cập nhật hình ảnh xem trước
  };

  // Xử lý khi người dùng thay đổi thông số kỹ thuật
  const handleSpecificationChange = (index, event) => {
    const newSpecifications = [...specifications];
    newSpecifications[index][event.target.name] = event.target.value;
    setSpecifications(newSpecifications);
  };

  // Thêm dòng thông số kỹ thuật mới
  const addSpecificationRow = () => {
    setSpecifications([...specifications, { size: '', content: '' }]);
  };

  // Xử lý khi người dùng nhấn Enter trong trường thông số kỹ thuật
  const handleEnter = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSpecificationRow();
    }
  };

  // Xử lý khi người dùng gửi form
  const handleSubmit = (event) => {
    event.preventDefault();
    // Xử lý gửi form ở đây
    console.log({
      productName,
      productImage,
      productSummary,
      productDescription,
      productPrice,
      productBrand,
      specifications,
    });
  };

  return (
    <div className="row">
      {/* Khu vực thêm sản phẩm */}
      <div className="col-lg-12 d-flex align-items-stretch">
        <div className="card w-100">
          <div className="card-body p-4">
            <h5 className="card-title fw-600 mb-4">Sửa sản phẩm </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="productName" className="form-label fw-600">Tên sản phẩm</label>
                <input
                  type="text"
                  className="form-control"
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Nhập tên sản phẩm"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="productImage" className="form-label fw-600">Hình ảnh</label>
                <input
                  type="file"
                  className="form-control"
                  id="productImage"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {productImage && (
                  <div className="mt-3">
                    <img
                      id="imagePreview"
                      src={productImage}
                      alt="Xem trước hình ảnh"
                      className="img-fluid"
                      style={{ display: 'block', maxHeight: '200px' }}
                    />
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="productSummary" className="form-label fw-600">Mô tả tóm tắt</label>
                <textarea
                  className="form-control"
                  id="productSummary"
                  rows="2"
                  value={productSummary}
                  onChange={(e) => setProductSummary(e.target.value)}
                  placeholder="Nhập mô tả tóm tắt"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="productDescription" className="form-label fw-600">Mô tả</label>
                <textarea
                  className="form-control"
                  id="productDescription"
                  rows="4"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Nhập mô tả chi tiết"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="productPrice" className="form-label fw-600">Giá</label>
                <input
                  type="number"
                  className="form-control"
                  id="productPrice"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Nhập giá sản phẩm"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="productBrand" className="form-label fw-600">Thương hiệu</label>
                <select
                  className="form-select"
                  id="productBrand"
                  value={productBrand}
                  onChange={(e) => setProductBrand(e.target.value)}
                >
                  <option value="">Chọn thương hiệu</option>
                  <option value="1">Thương hiệu A</option>
                  <option value="2">Thương hiệu B</option>
                  <option value="3">Thương hiệu C</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-600">Thông số kỹ thuật</label>
                <div id="specifications">
                  {specifications.map((spec, index) => (
                    <div className="row mb-2" key={index}>
                      <div className="col-md-2">
                        <input
                          type="text"
                          className="form-control"
                          name="size"
                          value={spec.size}
                          onChange={(e) => handleSpecificationChange(index, e)}
                          placeholder="Nhập thông số"
                          onKeyDown={handleEnter}
                        />
                      </div>
                      <div className="col-md-6">
                        <input
                          type="text"
                          className="form-control"
                          name="content"
                          value={spec.content}
                          onChange={(e) => handleSpecificationChange(index, e)}
                          placeholder="Nhập nội dung thông số"
                          onKeyDown={handleEnter}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="col-md-2 d-flex align-items-center ">
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={addSpecificationRow}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <Link to="/Home" className='btn btn-danger'> quay về</Link>
                <button type="submit" className="btn btn-primary">Thêm sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductForm;
