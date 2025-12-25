
import "./about-us-page.css";
import React, { useEffect, useState } from "react";
import axiosInstance from "../../features/admin/services/axiosInstance";
import { Container, Row, Col, Image, Card } from "react-bootstrap";

export default function AboutPage() {
  const [page, setPage] = useState(null);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    let mounted = true;
    axiosInstance.get("/pages/brand-story/").then((res) => {
      if (mounted) setPage(res.data);
    });
    axiosInstance
      .get("/pages/brand-story/blocks/")
      .then((res) => {
        if (mounted) setBlocks(res.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const title = page?.title || "";
  const banner = page?.banner_image || null;
  const descHtml = page?.content_html || "";

  return (
    <div className="about-us-page" style={{ background: '#fff' }}>
      <section
        className="text-center d-flex align-items-center justify-content-center"
        style={{ 
          minHeight: '10vh',
          paddingTop: '20px',
          paddingBottom: '10px'
        }}
      >
        <Container>
          <h1 className="fw-bold" style={{ 
            color: '#52c41a',
            fontSize: '4rem'
          }}>
            Câu chuyện thương hiệu
          </h1>
        </Container>
      </section>

      {/* STORYTELLING BLOCKS */}
      <section className="section-padding" style={{ padding: '40px 0 60px' }}>
        <Container>
          {blocks.map((blk, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <Row
                key={blk.id || idx}
                className={`align-items-center mb-4 pb-4 ${isEven ? '' : 'flex-row-reverse'}`}
                style={{ gap: '2rem 0' }}
              >
                <Col lg={6} className="px-lg-5">
                  <div 
                    className="block-image-wrapper position-relative"
                    style={{ 
                      borderRadius: '2rem', 
                      overflow: 'hidden',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)'
                    }}
                  >
                    {blk.image ? (
                      <Image
                        src={blk.image?.startsWith('http') ? blk.image : `${process.env.REACT_APP_API_URL?.replace('/api', '')}${blk.image}`}
                        alt={blk.heading || ""}
                        fluid
                        style={{ width: '100%', height: 450, objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: 450, background: '#f6ffed' }}></div>
                    )}
                  </div>
                </Col>
                
                <Col lg={6} className="px-lg-5">
                  <div className="content-box">
                    <span style={{ color: '#52c41a', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 }}>
                      Giai đoạn {blk.order || idx + 1}
                    </span>
                    <h2
                      className="display-6 fw-bold mt-2 mb-4"
                      style={{ color: "#135200" }}
                    >
                      {blk.heading || "Tiêu đề đang cập nhật"}
                    </h2>
                    <div
                      className="text-muted fs-6"
                      style={{ lineHeight: 1.9, textAlign: 'justify' }}
                      dangerouslySetInnerHTML={{ __html: blk.body_html || "" }}
                    />
                    <div style={{ marginTop: 32 }}>
                      <div style={{ width: 40, height: 2, background: '#d9f7be' }}></div>
                    </div>
                  </div>
                </Col>
              </Row>
            );
          })}
        </Container>
      </section>
    </div>
  );
}
