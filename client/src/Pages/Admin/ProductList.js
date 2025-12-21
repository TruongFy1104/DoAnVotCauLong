import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';

const ItemProduct = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = '/login'
    throw new Error("Token không tồn tại. Hãy đăng nhập lại.");
  }
  
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState(""); // Thông báo thành công hoặc lỗi
  const [searchTerm, setSearchTerm] = useState(""); // Từ khóa tìm kiếm
  const [editingQuantity, setEditingQuantity] = useState(null); // ID sản phẩm đang chỉnh sửa
  const [tempQuantity, setTempQuantity] = useState(""); // Số lượng tạm thời
  const [showSizeModal, setShowSizeModal] = useState(false); // Hiển thị modal size
  const [selectedProduct, setSelectedProduct] = useState(null); // Sản phẩm đang chọn
  const [productSizes, setProductSizes] = useState([]); // Danh sách size của sản phẩm
  const [editingSizeId, setEditingSizeId] = useState(null); // ID size đang chỉnh sửa
  const [tempSizeQuantity, setTempSizeQuantity] = useState(""); // Số lượng size tạm thời
  const navigate  = useNavigate(); // To handle redirection
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("http://localhost:3000/privatesite/products", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, 
          },
          credentials: "include", 
        });
        if (!response.ok) {
          throw new Error(`Lỗi: ${response.statusText}`);
        }
        const data = await response.json();
        setProducts(data); 
      } catch (error) {
        console.error("Error", error);
        setMessage("Đã xảy ra lỗi khi tải danh sách sản phẩm.");
      }
    };
    fetchProducts();
  }, []); 

  const handleSearch = (event) => {
    event.preventDefault();
    // Khi nhấn tìm kiếm, lọc sản phẩm theo ProductId
    setSearchTerm(event.target.value);
  };

  const filteredProducts = products.filter((product) =>
    product.ProductId.toString().includes(searchTerm)
  );

  const handleDelete = async (ProductId) => {
    const result = await Swal.fire({
      title: 'Bạn có chắc chắn muốn xóa sản phẩm này không?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token"); 
    if (!token) {
      Swal.fire("Lỗi", "Bạn chưa đăng nhập hoặc token không hợp lệ.", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/privatesite/products/${ProductId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`, 
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(products.filter((product) => product.ProductId !== ProductId));
        Swal.fire("Thành công!", "Xóa sản phẩm thành công!", "success");
      } else if (response.status === 403) {
        Swal.fire("Lỗi", "Bạn không có quyền xóa sản phẩm này.", "error");
      } else if (response.status === 400 && data.hasOrders) {
        // Sản phẩm đã có trong đơn hàng
        Swal.fire({
          icon: "warning",
          title: "Không thể xóa sản phẩm",
          html: `${data.message}<br><br>Sản phẩm này đã có người mua và không thể xóa khỏi hệ thống.`,
          confirmButtonColor: '#3085d6'
        });
      } else {
        Swal.fire("Lỗi", data.message || "Đã xảy ra lỗi khi xóa.", "error");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      Swal.fire("Lỗi", "Đã xảy ra lỗi khi xóa.", "error");
    }
  };

  // Ẩn/Hiện sản phẩm
  const handleToggleHide = async (ProductId, currentStatus) => {
    const action = currentStatus === 1 ? 'hiện' : 'ẩn';
    const result = await Swal.fire({
      title: `Bạn có chắc muốn ${action} sản phẩm này?`,
      text: currentStatus === 1 ? "Sản phẩm sẽ hiển thị lại trên website" : "Sản phẩm sẽ bị ẩn khỏi website",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `${action.charAt(0).toUpperCase() + action.slice(1)}`,
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Lỗi", "Bạn chưa đăng nhập hoặc token không hợp lệ.", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/privatesite/products/${ProductId}/toggle-hide`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Cập nhật trạng thái trong state
        setProducts(products.map(product => 
          product.ProductId === ProductId 
            ? { ...product, IsHidden: data.isHidden }
            : product
        ));
        Swal.fire("Thành công!", data.message, "success");
      } else {
        Swal.fire("Lỗi", data.message || "Đã xảy ra lỗi.", "error");
      }
    } catch (error) {
      console.error("Error toggling product visibility:", error);
      Swal.fire("Lỗi", "Đã xảy ra lỗi khi cập nhật.", "error");
    }
  };

  // Bắt đầu chỉnh sửa số lượng
  const handleEditQuantity = (productId, currentQuantity) => {
    setEditingQuantity(productId);
    setTempQuantity(currentQuantity || 0);
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingQuantity(null);
    setTempQuantity("");
  };

  // Lưu số lượng mới
  const handleSaveQuantity = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Lỗi", "Bạn chưa đăng nhập hoặc token không hợp lệ.", "error");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/privatesite/products/${productId}/quantity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: parseInt(tempQuantity) }),
      });

      if (response.ok) {
        const data = await response.json();
        // Cập nhật lại danh sách sản phẩm
        setProducts(products.map(p => 
          p.ProductId === productId ? { ...p, Quantity: parseInt(tempQuantity) } : p
        ));
        setEditingQuantity(null);
        setTempQuantity("");
        Swal.fire("Thành công!", "Cập nhật số lượng thành công!", "success");
      } else {
        const error = await response.json();
        Swal.fire("Lỗi", error.message || "Đã xảy ra lỗi khi cập nhật.", "error");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      Swal.fire("Lỗi", "Đã xảy ra lỗi khi cập nhật số lượng.", "error");
    }
  };

  // Hiển thị modal size
  const handleShowSizes = async (product) => {
    const token = localStorage.getItem("token");
    setSelectedProduct(product);
    
    try {
      // Lấy thông tin chi tiết sản phẩm bao gồm các size
      const response = await fetch(`http://localhost:3000/privatesite/productById/${product.ProductId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const sizes = product.Category.CategoryName === 'Quần áo' 
          ? data.ClothingSizes || [] 
          : data.ShoeSizes || [];
        setProductSizes(sizes);
        setShowSizeModal(true);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
      Swal.fire("Lỗi", "Không thể tải thông tin size.", "error");
    }
  };

  // Chỉnh sửa số lượng size
  const handleEditSizeQuantity = (sizeId, currentQuantity) => {
    setEditingSizeId(sizeId);
    setTempSizeQuantity(currentQuantity);
  };

  // Lưu số lượng size
  const handleSaveSizeQuantity = async (sizeId, size) => {
    const token = localStorage.getItem("token");
    const categoryName = selectedProduct.Category.CategoryName;
    const sizeType = categoryName === 'Quần áo' ? 'clothing' : 'shoe';
    
    try {
      const response = await fetch(`http://localhost:3000/privatesite/products/${selectedProduct.ProductId}/size-quantity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          sizeType,
          size,
          quantity: parseInt(tempSizeQuantity)
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Cập nhật lại danh sách size
        setProductSizes(productSizes.map(s => 
          s.Size === size ? { ...s, Quantity: parseInt(tempSizeQuantity) } : s
        ));
        // Cập nhật lại tổng số lượng trong danh sách sản phẩm
        setProducts(products.map(p => 
          p.ProductId === selectedProduct.ProductId ? { ...p, Quantity: data.totalQuantity } : p
        ));
        setEditingSizeId(null);
        setTempSizeQuantity("");
        Swal.fire("Thành công!", "Cập nhật số lượng size thành công!", "success");
      } else {
        const error = await response.json();
        Swal.fire("Lỗi", error.message || "Đã xảy ra lỗi khi cập nhật.", "error");
      }
    } catch (error) {
      console.error("Error updating size quantity:", error);
      Swal.fire("Lỗi", "Đã xảy ra lỗi khi cập nhật số lượng.", "error");
    }
  };

  return (
    <div className="container-fluid">
      {message && <div className="alert alert-info">{message}</div>}
      <div className="row">
        <div className="col-lg-12 d-flex align-items-stretch">
          <div className="card w-100">
            <div className="card-body p-4">
               <div className="row">
                <div className="col-lg-6 col-md-6">
                  <h5 className="card-title fw-600 mb-4">Danh sách sản phẩm</h5>
                </div>
                <div className="col-lg-6 col-md-6">
                  <form id="findProductForm">
                    <div className="searchForm">
                      <input
                        className="form-control"
                        id="searchNameInput"
                        name="name"
                        placeholder="Nhập vào mã sản phẩm để tìm kiếm ..."
                        value={searchTerm}
                        onChange={handleSearch} // Cập nhật từ khóa tìm kiếm
                      />
                      <button type="submit" id="btnSubmit_search" className="btn btn-default">
                        <i className="ti ti-search"></i>
                      </button>
                    </div>
                  </form>
                </div>
                </div>
              <div className="table-responsive">
                <table className="table text-nowrap mb-0 align-middle">
                  <thead className="text-dark fs-4">
                    <tr>
                      <th className="text-center ">
                        <h6 className="fw-600 mb-0">Id</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Tên sản phẩm</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Giá</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Giảm giá</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Thương hiệu</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Số lượng</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Trạng thái</h6>
                      </th>
                      <th className="text-center">
                        <h6 className="fw-600 mb-0">Lệnh</h6>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredProducts) && filteredProducts.map((product) => (
                    <tr key={product.ProductId}>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-0">{product.ProductId}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <h6 className="fw-600 mb-1">{product.ProductName}</h6>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{product.Price}</p>
                      </td>
                      <td className="border-bottom-0 text-center">
                        <p className="mb-0 fw-normal">{product.Discount}</p>
                      </td>
                      <td className="border-bottom-0 text-center">
                        {product.Brand.BrandName}
                      </td>
                      <td className="border-bottom-0 text-center">
                        {product.Category && (product.Category.CategoryName === 'Quần áo' || product.Category.CategoryName === 'Giày') ? (
                          <div className="d-flex justify-content-center align-items-center gap-2">
                            <span className="fw-600" style={{ minWidth: '30px' }}>{product.Quantity || 0}</span>
                            <button 
                              className="btn btn-info btn-sm"
                              onClick={() => handleShowSizes(product)}
                              title="Xem và chỉnh sửa số lượng từng size"
                              style={{ minWidth: '80px' }}
                            >
                              Thêm SL
                            </button>
                          </div>
                        ) : (
                          editingQuantity === product.ProductId ? (
                            <div className="d-flex gap-2 justify-content-center align-items-center">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '70px' }}
                                value={tempQuantity}
                                onChange={(e) => setTempQuantity(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveQuantity(product.ProductId);
                                  if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                              />
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleSaveQuantity(product.ProductId)}
                                title="Lưu"
                                style={{ minWidth: '50px' }}
                              >
                                Lưu
                              </button>
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={handleCancelEdit}
                                title="Hủy"
                                style={{ minWidth: '50px' }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex gap-2 justify-content-center align-items-center">
                              <span className="fw-600" style={{ minWidth: '30px' }}>{product.Quantity || 0}</span>
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditQuantity(product.ProductId, product.Quantity)}
                                title="Chỉnh sửa số lượng"
                                style={{ minWidth: '80px' }}
                              >
                                Thêm SL
                              </button>
                            </div>
                          )
                        )}
                      </td>
                      <td className="border-bottom-0 text-center">
                        <span className={`badge ${product.IsHidden === 1 ? 'bg-danger' : 'bg-success'}`}>
                          {product.IsHidden === 1 ? 'Đã ẩn' : 'Hiển thị'}
                        </span>
                      </td>
                      <td className="border-bottom-0 text-center">
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        <Link 
                          to={`/privatesite/addproduct/${product.ProductId}`}
                          state={{ product: product }}
                          className="btn btn-warning btn-sm"
                        >
                          Sửa
                        </Link>
                        <button 
                          className={`btn btn-sm ${product.IsHidden === 1 ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => handleToggleHide(product.ProductId, product.IsHidden)}
                          title={product.IsHidden === 1 ? 'Hiện sản phẩm' : 'Ẩn sản phẩm'}
                        >
                          {product.IsHidden === 1 ? 'Hiện' : 'Ẩn'}
                        </button>
                      </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Size */}
      {showSizeModal && selectedProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowSizeModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Quản lý Size - {selectedProduct.ProductName}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSizeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted mb-2">
                    Danh mục: <strong>{selectedProduct.Category?.CategoryName}</strong>
                  </p>
                  <p className="text-muted mb-3">
                    Tổng số lượng: <strong>{productSizes.reduce((sum, s) => sum + (s.Quantity || 0), 0)}</strong>
                  </p>
                </div>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th className="text-center">Size</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSizes.length > 0 ? (
                      productSizes.map((sizeItem) => (
                        <tr key={sizeItem.Size}>
                          <td className="text-center">
                            <strong>{sizeItem.Size}</strong>
                          </td>
                          <td className="text-center">
                            {editingSizeId === sizeItem.Size ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px', margin: '0 auto' }}
                                value={tempSizeQuantity}
                                onChange={(e) => setTempSizeQuantity(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveSizeQuantity(sizeItem.Size, sizeItem.Size);
                                  if (e.key === 'Escape') { setEditingSizeId(null); setTempSizeQuantity(''); }
                                }}
                                autoFocus
                              />
                            ) : (
                              <span className="fw-600">{sizeItem.Quantity || 0}</span>
                            )}
                          </td>
                          <td className="text-center">
                            {editingSizeId === sizeItem.Size ? (
                              <div className="d-flex gap-2 justify-content-center">
                                <button 
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleSaveSizeQuantity(sizeItem.Size, sizeItem.Size)}
                                >
                                  Lưu
                                </button>
                                <button 
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => { setEditingSizeId(null); setTempSizeQuantity(''); }}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleEditSizeQuantity(sizeItem.Size, sizeItem.Quantity)}
                              >
                                Sửa
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center text-muted">
                          Chưa có size nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSizeModal(false)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemProduct;
