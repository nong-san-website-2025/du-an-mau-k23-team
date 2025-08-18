
'use client'

import './about-us-page.css';

import a1 from '../../assets/image/banner.jpg';
import a2 from '../../assets/image/K.jpg';
import a3 from '../../assets/image/R.png';
import a4 from '../../assets/image/V.jpg';
import a5 from '../../assets/image/N.jpg';
import a6 from '../../assets/image/S.jpg';
import a7 from '../../assets/image/T.jpg';


import React from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { CheckCircle, Leaf, Handshake, Users, Award, Globe, Lightbulb } from 'lucide-react'; // Thêm các icon mới



export default function AboutPage() {
  return (
    <div className="about-us-page">
      {/* Hero Section */}
      <section className="about-hero-section position-relative text-white text-center d-flex align-items-center justify-content-center section-padding">
        <Image
          src={a1}
          alt="NôngSản.vn About Us Hero"
          fluid
          className="position-absolute w-100 h-100 object-fit-cover"
          style={{ zIndex: -1 }}
        />
  {/* <div className="about-hero-overlay position-absolute w-100 h-100"></div> */}
        <Container className="position-relative" style={{ zIndex: 1 }}>
          <h1 className="about-hero-title display-3 fw-bold mb-4 animate__animated animate__fadeInDown">
            Về Greenfarm
          </h1>
          <p className="lead mx-auto mb-5 animate__animated animate__fadeInUp" style={{ maxWidth: '900px' }}>
            Nền tảng thương mại điện tử hàng đầu Việt Nam, chuyên cung cấp nông sản tươi sống, an toàn và chất lượng cao trực tiếp từ nông trại đến bàn ăn của bạn.
          </p>
          <Button
            href="#our-story"
            variant="outline-light"
            size="lg"
            className="about-btn fw-bold animate__animated animate__zoomIn"
          >
            Khám Phá Câu Chuyện Của Chúng Tôi
          </Button>
        </Container>
      </section>

      {/* Our Story / Introduction Section */}
  <section id="our-story" className="about-section section-padding bg-white">
    <Container>
      <div
        className="d-flex flex-lg-nowrap flex-wrap align-items-center justify-content-center gap-5"
        style={{
          background: 'linear-gradient(90deg, #f8fafc 60%, #fff 100%)',
          borderRadius: '2rem',
          boxShadow: '0 8px 40px 0 rgba(34,139,34,0.10)',
          padding: '32px 32px 32px 0',
          margin: '0 auto',
          maxWidth: 1800,
          minHeight: 400,
        }}
      >
        <div
          className="story-img-wrapper animate__animated animate__fadeInLeft"
          style={{
            flex: '0 0 420px',
            maxWidth: 420,
            minWidth: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 340,
            borderRadius: '1.5rem',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(34,139,34,0.13)',
          }}
        >
          <Image
            src={a5}
            alt="Our Story"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '1.5rem',
              boxShadow: '0 2px 16px rgba(34,139,34,0.08)'
            }}
          />
        </div>
        <div
          className="story-content animate__animated animate__fadeInRight"
          style={{
            flex: '1 1 480px',
            minWidth: 320,
            padding: '0 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h2
            className="display-4 fw-bold mb-3"
            style={{ color: '#218838', letterSpacing: '0.5px', lineHeight: 1.15 }}
          >
            Câu Chuyện Của<br />NôngSản.vn
          </h2>
          <p
            className="lead mb-3"
            style={{ color: '#444', fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.6 }}
          >
            NôngSản.vn ra đời từ niềm đam mê với nông nghiệp sạch và mong muốn mang những sản phẩm tốt nhất đến tay người tiêu dùng. Chúng tôi tin rằng mọi người đều xứng đáng được thưởng thức thực phẩm tươi ngon, an toàn và có nguồn gốc rõ ràng.
          </p>
          <p
            style={{ color: '#666', fontSize: '1.08rem', lineHeight: 1.7, maxWidth: 650 }}
          >
            Với sự phát triển của công nghệ, chúng tôi đã xây dựng một cầu nối vững chắc giữa những người nông dân cần cù và cộng đồng, tạo ra một hệ sinh thái bền vững nơi chất lượng và sự minh bạch là ưu tiên hàng đầu.
          </p>
        </div>
      </div>
    </Container>
  </section>

      {/* Mission & Vision Section */}
  <section className="about-section section-padding bg-light">
        <Container>
          <Row className="mb-5 text-center">
            <Col>
              <h2 className="about-section-title display-5 fw-bold text-success">Sứ Mệnh & Tầm Nhìn</h2>
              <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
                Chúng tôi không chỉ bán nông sản, chúng tôi kiến tạo một tương lai xanh và bền vững.
              </p>
            </Col>
          </Row>
          <Row className="align-items-center mb-5">
            <Col md={6} className="mb-4 mb-md-0 animate__animated animate__fadeInLeft">
              <h3 className="h2 fw-bold mb-3 text-success">Sứ Mệnh Của Chúng Tôi</h3>
              <p className="lead text-muted">
                Cung cấp nông sản tươi sống, an toàn và chất lượng cao trực tiếp từ nông trại đến người tiêu dùng, đồng thời hỗ trợ phát triển bền vững cho cộng đồng nông nghiệp Việt Nam.
              </p>
              <ul className="list-unstyled text-muted">
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Đảm bảo chất lượng và an toàn thực phẩm.</li>
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Nâng cao giá trị nông sản Việt.</li>
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Xây dựng cộng đồng tiêu dùng thông thái.</li>
              </ul>
            </Col>
            <Col md={6} className="animate__animated animate__fadeInRight">
              <Image
                src={a6}
                alt="Our Mission"
                fluid
                rounded
                className="shadow-lg"
              />
            </Col>
          </Row>
          <Row className="align-items-center flex-md-row-reverse">
            <Col md={6} className="mb-4 mb-md-0 animate__animated animate__fadeInRight">
              <h3 className="h2 fw-bold mb-3 text-success">Tầm Nhìn Của Chúng Tôi</h3>
              <p className="lead text-muted">
                Trở thành nền tảng thương mại điện tử nông sản hàng đầu, được tin cậy nhất tại Việt Nam, mở rộng ra thị trường quốc tế.
              </p>
              <ul className="list-unstyled text-muted">
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Mở rộng mạng lưới nông trại đối tác.</li>
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Ứng dụng công nghệ vào chuỗi cung ứng.</li>
                <li className="mb-2"><CheckCircle size={20} className="text-success me-2" /> Góp phần vào sự phát triển nông nghiệp bền vững.</li>
              </ul>
            </Col>
            <Col md={6} className="animate__animated animate__fadeInLeft">
              <Image
                src={a7}
                alt="Our Vision"
                fluid
                rounded
                className="shadow-lg"
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Core Values Section */}
      <section className="about-section section-padding bg-white">
        <Container className="text-center">
          <h2 className="about-section-title display-5 fw-bold mb-5 text-success">Giá Trị Cốt Lõi</h2>
          <Row className="g-4">
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Leaf size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Tươi Sạch & Hữu Cơ</Card.Title>
                  <Card.Text className="text-muted">Cam kết cung cấp nông sản tươi mới, không hóa chất độc hại, đảm bảo an toàn cho sức khỏe người tiêu dùng.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp animate__delay-1s">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Award size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Chất Lượng Vượt Trội</Card.Title>
                  <Card.Text className="text-muted">Mọi sản phẩm đều được kiểm định nghiêm ngặt, đạt tiêu chuẩn chất lượng cao nhất từ khâu trồng trọt đến thu hoạch.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp animate__delay-2s">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Handshake size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Minh Bạch & Tin Cậy</Card.Title>
                  <Card.Text className="text-muted">Thông tin nguồn gốc sản phẩm rõ ràng, quy trình sản xuất minh bạch, xây dựng niềm tin vững chắc với khách hàng.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp animate__delay-3s">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Users size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Hỗ Trợ Nông Dân</Card.Title>
                  <Card.Text className="text-muted">Tạo điều kiện thuận lợi để nông dân tiếp cận thị trường, nâng cao thu nhập và phát triển bền vững.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp animate__delay-4s">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Globe size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Phát Triển Bền Vững</Card.Title>
                  <Card.Text className="text-muted">Đóng góp vào việc bảo vệ môi trường và phát triển nông nghiệp bền vững cho thế hệ tương lai.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} md={6} className="animate__animated animate__fadeInUp animate__delay-5s">
              <Card className="about-card h-100 shadow-sm border-0 hover-shadow-lg">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Lightbulb size={48} className="text-success mb-3" />
                  <Card.Title as="h3" className="h5 fw-semibold mb-2">Đổi Mới Liên Tục</Card.Title>
                  <Card.Text className="text-muted">Luôn tìm kiếm và áp dụng các giải pháp công nghệ mới để tối ưu hóa chuỗi cung ứng và trải nghiệm khách hàng.</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How We Work / Farm to Table Section */}
      <section className="about-section section-padding bg-light">
        <Container className="text-center">
          <h2 className="about-section-title display-5 fw-bold mb-4 text-success">
              Quy Trình Của Chúng Tôi: Từ Nông Trại Đến Bàn Ăn
          </h2>
          <p className="lead text-muted mb-5 mx-auto" style={{ maxWidth: '900px' }}>
              Chúng tôi tự hào về mô hình kinh doanh độc đáo, nơi nông sản được vận chuyển trực tiếp từ nông trại đến tay người tiêu dùng, loại bỏ các khâu trung gian không cần thiết.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', flexWrap: 'nowrap' }}>
            <div style={{ flex: '0 1 370px', maxWidth: '370px' }} className="animate__animated animate__zoomIn">
              <Card className="about-card h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Image src={a2} alt="Farm" className="mb-3 farm-process-img" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px' }} />
                  <Card.Title as="h4" className="h5 fw-semibold mb-2">1. Lựa Chọn Nông Trại</Card.Title>
                  <Card.Text className="text-muted">Hợp tác với các nông trại uy tín, đạt chuẩn VietGAP/GlobalGAP.</Card.Text>
                </Card.Body>
              </Card>
            </div>
            <div style={{ flex: '0 1 370px', maxWidth: '370px' }} className="animate__animated animate__zoomIn animate__delay-1s">
              <Card className="about-card h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Image src={a3} alt="Farm" className="mb-3 farm-process-img" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px' }} />
                  <Card.Title as="h4" className="h5 fw-semibold mb-2">2. Thu Hoạch & Kiểm Định</Card.Title>
                  <Card.Text className="text-muted">Nông sản được thu hoạch tươi mới và kiểm định chất lượng nghiêm ngặt.</Card.Text>
                </Card.Body>
              </Card>
            </div>
            <div style={{ flex: '0 1 370px', maxWidth: '370px' }} className="animate__animated animate__zoomIn animate__delay-2s">
              <Card className="about-card h-100 shadow-sm border-0">
                <Card.Body className="d-flex flex-column align-items-center p-4">
                  <Image src={a4} alt="Farm" className="mb-3 farm-process-img" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px' }} />
                  <Card.Title as="h4" className="h5 fw-semibold mb-2">3. Vận Chuyển Trực Tiếp</Card.Title>
                  <Card.Text className="text-muted">Giao hàng nhanh chóng, đảm bảo độ tươi ngon đến tận tay bạn.</Card.Text>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="about-section bg-success text-white text-center d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '320px', padding: 0 }}>
        <div style={{ width: '100%' }}>
          <h2 className="about-section-title display-4 fw-bold mb-3" style={{ marginTop: 48, color: '#fff' }}>
            Trải Nghiệm Nông Sản Tươi Sạch Cùng NôngSản.vn!
          </h2>
          <p className="lead mb-4" style={{ fontWeight: 400 }}>
            Hãy cùng chúng tôi xây dựng một tương lai nơi thực phẩm sạch là điều hiển nhiên.
          </p>
          <Button
            href="/productuser"
            variant="light"
            size="lg"
            className="about-btn fw-bold text-success"
            style={{ minWidth: 220, fontSize: '1.15rem', borderRadius: 8 }}
          >
            Khám Phá Sản Phẩm Ngay
          </Button>
        </div>
      </section>
    </div>
  );
}
