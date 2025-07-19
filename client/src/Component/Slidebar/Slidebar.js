import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./Slidebar.css";

const images = [
  "/Images/Banners/banner4.webp",
  "/Images/Banners/banner2.webp",
  "/Images/Banners/banner3.webp",
  "/Images/Banners/banner1.webp",
  "/Images/Banners/banner5.webp",
];

const Slidebar = () => {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(0);
  const slideRefs = useRef([]);
  const touchStartX = useRef(null);
  const dragX = useRef(0);
  const isDragging = useRef(false);

  // Auto chuyển ảnh mỗi 6s
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [current, images.length]);

  // Animation khi chuyển slide (slide ngang mượt)
  useEffect(() => {
    if (prev === current) return;
    const direction =
      prev < current || (prev === images.length - 1 && current === 0)
        ? 1
        : -1;
    const fromX = direction * window.innerWidth;
    const toX = -direction * window.innerWidth;

    if (slideRefs.current[current]) {
      gsap.fromTo(
        slideRefs.current[current],
        { x: fromX, autoAlpha: 1, zIndex: 2 },
        {
          x: 0,
          autoAlpha: 1,
          zIndex: 2,
          duration: 0.7,
          ease: "power3.out",
        }
      );
    }
    if (slideRefs.current[prev]) {
      gsap.to(slideRefs.current[prev], {
        x: toX,
        autoAlpha: 0.7,
        zIndex: 1,
        duration: 0.7,
        ease: "power3.in",
      });
    }
  }, [current, prev, images.length]);

  const handlePrev = () => {
    setPrev(current);
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setPrev(current);
    setCurrent((prev) => (prev + 1) % images.length);
  };

  // Swipe/drag effect
  const handleTouchStart = (e) => {
    isDragging.current = true;
    touchStartX.current = e.touches ? e.touches[0].clientX : e.clientX;
    dragX.current = 0;
    if (slideRefs.current[current]) {
      gsap.set(slideRefs.current[current], { x: 0, zIndex: 2 });
    }
    if (slideRefs.current[prev]) {
      gsap.set(slideRefs.current[prev], { x: 0, zIndex: 1 });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    dragX.current = clientX - touchStartX.current;
    if (slideRefs.current[current]) {
      gsap.set(slideRefs.current[current], { x: dragX.current, zIndex: 2 });
    }
    if (slideRefs.current[prev]) {
      gsap.set(
        slideRefs.current[prev],
        {
          x:
            dragX.current > 0
              ? -window.innerWidth + dragX.current
              : window.innerWidth + dragX.current,
          zIndex: 1,
        }
      );
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (Math.abs(dragX.current) > 80) {
      if (dragX.current < 0) {
        // Kéo sang trái
        handleNext();
      } else {
        // Kéo sang phải
        handlePrev();
      }
    } else {
      // Nếu không đủ xa thì trả về vị trí cũ
      if (slideRefs.current[current]) {
        gsap.to(slideRefs.current[current], {
          x: 0,
          duration: 0.5,
          ease: "power2.out",
        });
      }
      if (slideRefs.current[prev]) {
        gsap.to(slideRefs.current[prev], {
          x: dragX.current > 0 ? -window.innerWidth : window.innerWidth,
          duration: 0.5,
          ease: "power2.out",
        });
      }
    }
    dragX.current = 0;
    touchStartX.current = null;
  };

  return (
    <div
      className="slidebar-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={(e) => {
        if (isDragging.current) handleTouchMove(e);
      }}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      {images.map((img, idx) => (
        <img
          key={idx}
          ref={(el) => (slideRefs.current[idx] = el)}
          src={img}
          alt={`slide-${idx}`}
          className={`slidebar-img${current === idx ? " active" : ""}`}
          style={{
            display: current === idx || prev === idx ? "block" : "none",
            cursor: "grab",
            zIndex: current === idx ? 2 : 1,
          }}
          draggable={false}
        />
      ))}
      <button
        className="slidebar-btn prev"
        onClick={handlePrev}
        aria-label="Prev"
      >
        &#10094;
      </button>
      <button
        className="slidebar-btn next"
        onClick={handleNext}
        aria-label="Next"
      >
        &#10095;
      </button>
      <div className="slidebar-dots">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`dot${current === idx ? " active" : ""}`}
            onClick={() => {
              setPrev(current);
              setCurrent(idx);
            }}
          />
        ))}
      </div>
    </div>
    
  );
};

export const SlidebarFeatures = () => (
  <div className="slidebar-features">
    <div className="feature-item">
      <span className="feature-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#fff"/><path d="M8 22V12.8A1.8 1.8 0 0 1 9.8 11h10.4A1.8 1.8 0 0 1 22 12.8V22M8 22h14M8 22v1.2A1.8 1.8 0 0 0 9.8 25h10.4a1.8 1.8 0 0 0 1.8-1.8V22" stroke="#e26a1b" strokeWidth="1.5"/><path d="M12 15h4m-4 3h7" stroke="#e26a1b" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </span>
      <div>
        <div className="feature-title">Vận chuyển <b>TOÀN QUỐC</b></div>
        <div className="feature-desc">Thanh toán khi nhận hàng</div>
      </div>
    </div>
    <div className="feature-item">
      <span className="feature-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#fff"/><path d="M16 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 0v8l4 2" stroke="#e26a1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <div>
        <div className="feature-title"><b>Bảo đảm chất lượng</b></div>
        <div className="feature-desc">Sản phẩm bảo đảm chất lượng.</div>
      </div>
    </div>
    <div className="feature-item">
      <span className="feature-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#fff"/><path d="M10 22V10h12v12H10Zm0 0h12" stroke="#e26a1b" strokeWidth="1.5"/><path d="M14 14h4m-4 4h7" stroke="#e26a1b" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </span>
      <div>
        <div className="feature-title">Tiến hành <b>THANH TOÁN</b></div>
        <div className="feature-desc">Với nhiều <b>PHƯƠNG THỨC</b></div>
      </div>
    </div>
    <div className="feature-item">
      <span className="feature-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 32 32"><rect width="32" height="32" rx="16" fill="#fff"/><path d="M16 8a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 0v8l4 2" stroke="#e26a1b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <div>
        <div className="feature-title"><b>Đổi sản phẩm mới</b></div>
        <div className="feature-desc">nếu sản phẩm lỗi</div>
      </div>
    </div>
  </div>
);

export const SlidebarGallery = () => (
  <div className="slidebar-gallery">
    <div className="gallery-item">
      <img src="/Images/Banners/poster1.png" alt="gallery1" />
      <div className="gallery-gloss"></div>
    </div>
    <div className="gallery-item">
      <img src="/Images/Banners/poster2.png" alt="gallery2" />
      <div className="gallery-gloss"></div>
    </div>
    <div className="gallery-item">
      <img src="/Images/Banners/poster3.png" alt="gallery3" />
      <div className="gallery-gloss"></div>
    </div>
  </div>
);

export default Slidebar;