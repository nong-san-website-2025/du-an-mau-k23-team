import React, { useState, useEffect } from "react";
import {
  Carrot, Apple, Wheat, Beef, Milk, Coffee,
  ChevronLeft, Star, Star as StarFill, ShoppingCart
} from "lucide-react";
import { Card, Button, Row, Col, Badge, Form, Spinner, Alert } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { productApi } from "../services/productApi";

const categories = [
  {
    key: "rau-cu-qua",
    name: "Rau Củ Quả",
    icon: Carrot,
    subcategories: [
      {
        name: "Rau lá xanh",
        products: [
          {
            id: 1,
            name: "Rau cải xanh",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
            price: 18000,
            unit: "kg",
            description: "Rau cải xanh tươi ngon, giàu vitamin, được trồng hữu cơ.",
            rating: 4,
            reviewCount: 25,
            isNew: true,
            isOrganic: true,
            discount: 10,
            location: "Đà Lạt",
            brand: "Nông trại Xanh",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Củ quả",
        products: [
          {
            id: 2,
            name: "Củ cải trắng",
            image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
            price: 35000,
            unit: "kg",
            description: "Củ cải trắng tươi ngon, thích hợp nấu canh.",
            rating: 4.5,
            reviewCount: 67,
            isNew: false,
            isOrganic: true,
            discount: 13,
            location: "Hà Nội",
            brand: "Trang trại Việt",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Nấm các loại",
        products: [
          {
            id: 3,
            name: "Nấm hương khô",
            image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80",
            price: 120000,
            unit: "kg",
            description: "Nấm hương khô cao cấp, thơm ngon bổ dưỡng.",
            rating: 4.9,
            reviewCount: 156,
            isNew: false,
            isOrganic: true,
            discount: 20,
            location: "Sapa",
            brand: "Nấm Sapa",
            isBestSeller: true,
          },
        ],
      },
      {
        name: "Rau thơm",
        products: [
          {
            id: 4,
            name: "Rau thơm tổng hợp",
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
            price: 15000,
            unit: "gói",
            description: "Gói rau thơm tổng hợp: húng quế, ngò, tía tô",
            rating: 4.4,
            reviewCount: 43,
            isNew: true,
            isOrganic: true,
            discount: 17,
            location: "TP.HCM",
            brand: "Vườn Xanh",
            isBestSeller: false,
          },
        ],
      },
    ],
  },
  {
    key: "trai-cay",
    name: "Trái Cây",
    icon: Apple,
    subcategories: [
      {
        name: "Trái cây nhiệt đới",
        products: [
          {
            id: 5,
            name: "Xoài cát Hòa Lộc",
            image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80",
            price: 45000,
            unit: "kg",
            description: "Xoài cát Hòa Lộc ngọt thơm, đặc sản miền Tây.",
            rating: 4.8,
            reviewCount: 98,
            isNew: true,
            isOrganic: true,
            discount: 5,
            location: "Tiền Giang",
            brand: "Vườn Miền Tây",
            isBestSeller: true,
          },
        ],
      },
      {
        name: "Trái cây nhập khẩu",
        products: [
          {
            id: 6,
            name: "Táo Envy New Zealand",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80",
            price: 120000,
            unit: "kg",
            description: "Táo Envy nhập khẩu, giòn ngọt, giàu dinh dưỡng.",
            rating: 4.7,
            reviewCount: 54,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "New Zealand",
            brand: "Envy",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Trái cây sấy",
        products: [
          {
            id: 7,
            name: "Chuối sấy giòn",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
            price: 60000,
            unit: "gói",
            description: "Chuối sấy giòn, snack lành mạnh cho mọi nhà.",
            rating: 4.2,
            reviewCount: 31,
            isNew: false,
            isOrganic: false,
            discount: 10,
            location: "Đồng Nai",
            brand: "Snack Việt",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Nước ép trái cây",
        products: [
          {
            id: 8,
            name: "Nước ép cam nguyên chất",
            image: "https://images.unsplash.com/photo-1465101178521-c1a9136a3c8b?auto=format&fit=crop&w=400&q=80",
            price: 25000,
            unit: "chai",
            description: "Nước ép cam tươi, không chất bảo quản.",
            rating: 4.6,
            reviewCount: 40,
            isNew: true,
            isOrganic: false,
            discount: 0,
            location: "Vĩnh Long",
            brand: "Fresh Juice",
            isBestSeller: false,
          },
        ],
      },
    ],
  },
  {
    key: "gao-ngu-coc",
    name: "Gạo & Ngũ Cốc",
    icon: Wheat,
    subcategories: [
      {
        name: "Gạo tẻ",
        products: [
          {
            id: 9,
            name: "Gạo ST25",
            image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80",
            price: 28000,
            unit: "kg",
            description: "Gạo ST25 thơm ngon, đạt giải gạo ngon nhất thế giới.",
            rating: 4.9,
            reviewCount: 120,
            isNew: false,
            isOrganic: true,
            discount: 0,
            location: "Sóc Trăng",
            brand: "ST25",
            isBestSeller: true,
          },
        ],
      },
      {
        name: "Gạo nàng hương",
        products: [
          {
            id: 10,
            name: "Gạo nàng hương chợ Đào",
            image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
            price: 32000,
            unit: "kg",
            description: "Gạo nàng hương dẻo thơm, đặc sản Long An.",
            rating: 4.7,
            reviewCount: 80,
            isNew: false,
            isOrganic: false,
            discount: 5,
            location: "Long An",
            brand: "Nàng Hương",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Ngũ cốc dinh dưỡng",
        products: [
          {
            id: 11,
            name: "Ngũ cốc yến mạch",
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
            price: 75000,
            unit: "gói",
            description: "Ngũ cốc yến mạch nhập khẩu, tốt cho sức khỏe.",
            rating: 4.5,
            reviewCount: 60,
            isNew: true,
            isOrganic: true,
            discount: 15,
            location: "Úc",
            brand: "Oats",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Yến mạch",
        products: [
          {
            id: 12,
            name: "Yến mạch cán mỏng",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80",
            price: 90000,
            unit: "gói",
            description: "Yến mạch cán mỏng, phù hợp ăn sáng, làm bánh.",
            rating: 4.3,
            reviewCount: 22,
            isNew: false,
            isOrganic: true,
            discount: 0,
            location: "Mỹ",
            brand: "Quaker",
            isBestSeller: false,
          },
        ],
      },
    ],
  },
  {
    key: "thit-hai-san",
    name: "Thịt & Hải Sản",
    icon: Beef,
    subcategories: [
      {
        name: "Thịt bò",
        products: [
          {
            id: 13,
            name: "Thịt bò Úc",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
            price: 350000,
            unit: "kg",
            description: "Thịt bò Úc nhập khẩu, mềm ngon, giàu dinh dưỡng.",
            rating: 4.8,
            reviewCount: 45,
            isNew: false,
            isOrganic: false,
            discount: 10,
            location: "Úc",
            brand: "Beef Australia",
            isBestSeller: true,
          },
        ],
      },
      {
        name: "Thịt heo",
        products: [
          {
            id: 14,
            name: "Thịt heo sạch",
            image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
            price: 120000,
            unit: "kg",
            description: "Thịt heo sạch, không chất tăng trọng.",
            rating: 4.6,
            reviewCount: 30,
            isNew: false,
            isOrganic: true,
            discount: 0,
            location: "Đồng Nai",
            brand: "Heo Việt",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Thịt gà",
        products: [
          {
            id: 15,
            name: "Gà ta thả vườn",
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
            price: 95000,
            unit: "kg",
            description: "Gà ta thả vườn, thịt chắc, ngọt tự nhiên.",
            rating: 4.7,
            reviewCount: 38,
            isNew: true,
            isOrganic: false,
            discount: 5,
            location: "Bình Dương",
            brand: "Gà Ta",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Hải sản tươi sống",
        products: [
          {
            id: 16,
            name: "Tôm sú tươi",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80",
            price: 280000,
            unit: "kg",
            description: "Tôm sú tươi sống, đánh bắt trong ngày.",
            rating: 4.9,
            reviewCount: 60,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Cà Mau",
            brand: "Seafood",
            isBestSeller: true,
          },
        ],
      },
    ],
  },
  {
    key: "sua-trung",
    name: "Sữa & Trứng",
    icon: Milk,
    subcategories: [
      {
        name: "Sữa tươi",
        products: [
          {
            id: 17,
            name: "Sữa tươi Vinamilk",
            image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=400&q=80",
            price: 32000,
            unit: "lít",
            description: "Sữa tươi tiệt trùng, bổ sung canxi.",
            rating: 4.5,
            reviewCount: 80,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Việt Nam",
            brand: "Vinamilk",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Sữa chua",
        products: [
          {
            id: 18,
            name: "Sữa chua uống Probi",
            image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
            price: 25000,
            unit: "lốc",
            description: "Sữa chua uống men sống tốt cho tiêu hóa.",
            rating: 4.6,
            reviewCount: 50,
            isNew: true,
            isOrganic: false,
            discount: 0,
            location: "Việt Nam",
            brand: "Probi",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Trứng gà",
        products: [
          {
            id: 19,
            name: "Trứng gà ta",
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
            price: 35000,
            unit: "chục",
            description: "Trứng gà ta sạch, giàu dinh dưỡng.",
            rating: 4.8,
            reviewCount: 70,
            isNew: false,
            isOrganic: true,
            discount: 0,
            location: "Bến Tre",
            brand: "Gà Ta",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Phô mai",
        products: [
          {
            id: 20,
            name: "Phô mai Con Bò Cười",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80",
            price: 45000,
            unit: "hộp",
            description: "Phô mai mềm, bổ sung canxi cho bé.",
            rating: 4.7,
            reviewCount: 33,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Pháp",
            brand: "La Vache Qui Rit",
            isBestSeller: false,
          },
        ],
      },
    ],
  },
  {
    key: "gia-vi-do-kho",
    name: "Gia Vị & Đồ Khô",
    icon: Coffee,
    subcategories: [
      {
        name: "Gia vị truyền thống",
        products: [
          {
            id: 21,
            name: "Muối tôm Tây Ninh",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80",
            price: 25000,
            unit: "hũ",
            description: "Muối tôm Tây Ninh cay mặn đặc trưng.",
            rating: 4.6,
            reviewCount: 40,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Tây Ninh",
            brand: "Muối Tây Ninh",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Nước mắm",
        products: [
          {
            id: 22,
            name: "Nước mắm Phú Quốc",
            image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
            price: 70000,
            unit: "chai",
            description: "Nước mắm truyền thống, đậm đà vị cá cơm.",
            rating: 4.9,
            reviewCount: 55,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Phú Quốc",
            brand: "Nước mắm PQ",
            isBestSeller: true,
          },
        ],
      },
      {
        name: "Đồ khô",
        products: [
          {
            id: 23,
            name: "Tôm khô Cà Mau",
            image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
            price: 350000,
            unit: "kg",
            description: "Tôm khô đặc sản Cà Mau, thơm ngon tự nhiên.",
            rating: 4.8,
            reviewCount: 20,
            isNew: false,
            isOrganic: false,
            discount: 0,
            location: "Cà Mau",
            brand: "Đặc sản Miền Tây",
            isBestSeller: false,
          },
        ],
      },
      {
        name: "Bánh kẹo",
        products: [
          {
            id: 24,
            name: "Bánh pía Sóc Trăng",
            image: "https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=400&q=80",
            price: 50000,
            unit: "hộp",
            description: "Bánh pía Sóc Trăng nhân đậu xanh trứng muối.",
            rating: 4.5,
            reviewCount: 18,
            isNew: true,
            isOrganic: false,
            discount: 0,
            location: "Sóc Trăng",
            brand: "Bánh Pía",
            isBestSeller: false,
          },
        ],
      },
    ],
  },
];

function renderStars(rating) {
  return (
    <>
      {[...Array(5)].map((_, i) =>
        i < Math.floor(rating) ? (
          <StarFill key={i} size={16} className="text-warning" fill="#ffc107" strokeWidth={0} />
        ) : (
          <Star key={i} size={16} className="text-secondary" />
        )
      )}
    </>
  );
}

export default function UserProductPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const categoryParam = params.get("category");

  // Tìm category theo tên truyền trên URL, nếu không có thì mặc định là category đầu tiên
  const initialCategory =
    categories.find((cat) => cat.name === categoryParam) || categories[0];

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [activeSub, setActiveSub] = useState("Tất cả");
  
  // State cho API data
  const [apiProducts, setApiProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useApiData, setUseApiData] = useState(false); // Toggle giữa hardcode và API

  // Load dữ liệu từ API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const products = await productApi.getAllProducts();
        setApiProducts(products);
        console.log('Đã tải được sản phẩm từ API:', products);
      } catch (err) {
        setError(err.message);
        console.error('Lỗi khi tải sản phẩm:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Khi categoryParam thay đổi, cập nhật selectedCategory
  React.useEffect(() => {
    const found = categories.find((cat) => cat.name === categoryParam);
    if (found) {
      setSelectedCategory(found);
      setActiveSub("Tất cả");
    }
  }, [categoryParam]);

  // Chọn nguồn dữ liệu: API hoặc hardcode
  const allProducts = useApiData 
    ? apiProducts 
    : selectedCategory.subcategories.flatMap((sub) => sub.products);

  // Lọc sản phẩm theo subcategory (chỉ áp dụng cho hardcode data)
  const filteredProducts = useApiData 
    ? allProducts // API data không có subcategory structure
    : (activeSub === "Tất cả"
        ? allProducts
        : selectedCategory.subcategories.find((s) => s.name === activeSub)?.products || []);

  // Lọc theo search
  const displayedProducts = filteredProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-4">
      {/* Toggle giữa hardcode và API data */}
      <div className="mb-3 d-flex align-items-center gap-3">
        <Form.Check 
          type="switch"
          id="api-toggle"
          label={useApiData ? "Đang sử dụng dữ liệu từ API" : "Đang sử dụng dữ liệu mẫu"}
          checked={useApiData}
          onChange={(e) => setUseApiData(e.target.checked)}
        />
        {loading && <Spinner animation="border" size="sm" />}
        {error && <Badge bg="danger">Lỗi API: {error}</Badge>}
        {useApiData && !loading && (
          <Badge bg="success">
            Đã tải {apiProducts.length} sản phẩm từ backend
          </Badge>
        )}
      </div>

      {/* Thanh tìm kiếm */}
      <Form className="mb-3">
        <Form.Control
          type="search"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 350 }}
        />
      </Form>

      {/* Tabs danh mục cha */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.key}
            variant={cat.key === selectedCategory.key ? "dark" : "light"}
            className={cat.key === selectedCategory.key ? "fw-bold" : ""}
            onClick={() => {
              setSelectedCategory(cat);
              setActiveSub("Tất cả");
            }}
          >
            {cat.name}{" "}
            <Badge bg="secondary" className="ms-1">
              {cat.subcategories.reduce((sum, s) => sum + s.products.length, 0)}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Tabs subcategory */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <Button
          variant={activeSub === "Tất cả" ? "dark" : "light"}
          className={activeSub === "Tất cả" ? "fw-bold" : ""}
          onClick={() => setActiveSub("Tất cả")}
        >
          Tất cả{" "}
          <Badge bg="secondary" className="ms-1">
            {allProducts.length}
          </Badge>
        </Button>
        {selectedCategory.subcategories.map((sub) => (
          <Button
            key={sub.name}
            variant={activeSub === sub.name ? "dark" : "light"}
            className={activeSub === sub.name ? "fw-bold" : ""}
            onClick={() => setActiveSub(sub.name)}
          >
            {sub.name}{" "}
            <Badge bg="secondary" className="ms-1">
              {sub.products.length}
            </Badge>
          </Button>
        ))}
      </div>

      <div className="mb-2 text-muted">
        Hiển thị {displayedProducts.length} sản phẩm trong danh mục "
        <b>{selectedCategory.name}</b>"
      </div>

      {/* Danh sách sản phẩm */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {displayedProducts.map((product) => (
          <Col key={product.id}>
            <Card className="h-100 shadow-sm border-0">
              <div className="position-relative" style={{ height: 210 }}>
                <Card.Img
                  variant="top"
                  src={product.image || "https://via.placeholder.com/400x300?text=No+Image"}
                  alt={product.name}
                  style={{ height: 180, objectFit: "cover", borderRadius: "1rem 1rem 0 0" }}
                />
                {(product.discount || 0) > 0 && (
                  <Badge bg="danger" className="position-absolute top-0 start-0 m-2">
                    -{product.discount}%
                  </Badge>
                )}
                {product.isOrganic && (
                  <Badge bg="success" className="position-absolute top-0 start-50 translate-middle-x m-2">
                    Hữu cơ
                  </Badge>
                )}
                {product.isBestSeller && (
                  <Badge bg="warning" className="position-absolute top-0 end-0 m-2 text-white">
                    Bán chạy
                  </Badge>
                )}
                {product.isNew && (
                  <Badge bg="info" className="position-absolute bottom-0 start-0 m-2">
                    Mới
                  </Badge>
                )}
                {useApiData && (
                  <Badge bg="primary" className="position-absolute bottom-0 end-0 m-2">
                    API
                  </Badge>
                )}
              </div>
              <Card.Body className="d-flex flex-column">
                <Card.Title className="fw-semibold mb-1">{product.name}</Card.Title>
                <div className="mb-1 text-muted small">
                  {product.location && (
                    <span className="me-2">
                      <i className="bi bi-geo-alt"></i> {product.location}
                    </span>
                  )}
                  {product.brand && (
                    <span className="me-2">
                      <i className="bi bi-shop"></i> {product.brand}
                    </span>
                  )}
                  {useApiData && (
                    <span className="me-2">
                      <i className="bi bi-database"></i> ID: {product.id}
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="fw-bold" style={{ color: "#16a34a" }}>
                    {Number(product.price).toLocaleString()}đ
                  </span>
                  {(product.discount || 0) > 0 && (
                    <span className="text-muted ms-2 text-decoration-line-through">
                      {(Math.round(product.price / (1 - product.discount / 100) / 1000) * 1000).toLocaleString()}đ
                    </span>
                  )}
                  <span className="text-muted ms-1">/{product.unit || 'kg'}</span>
                </div>
                <Card.Text className="text-muted small mb-2" style={{ minHeight: 38 }}>
                  {product.description}
                </Card.Text>
                <div className="d-flex align-items-center mb-2">
                  {renderStars(product.rating || 0)}
                  <span className="ms-2 text-secondary small">
                    {product.rating || 0} ({product.reviewCount || product.review_count || 0})
                  </span>
                </div>
                <Button variant="success" className="mt-auto d-flex align-items-center justify-content-center">
                  <ShoppingCart size={18} className="me-2" /> Thêm vào giỏ
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {displayedProducts.length === 0 && (
        <div className="text-center text-muted py-5">Không tìm thấy sản phẩm phù hợp.</div>
      )}
    </div>
  );
}
