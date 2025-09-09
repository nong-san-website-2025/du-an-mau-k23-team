import React from "react";
import { Carousel } from "antd";

export default function BannerCarousel({ banners = [] }) {
  return (
    <div className="w-full mb-6">
      <Carousel autoplay>
        {banners.map((banner) => (
          <div key={banner.id} className="h-[300px]">
            <img
              src={banner.image}
              alt={banner.title}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}
