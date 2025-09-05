import { Carousel, Image } from "antd";

export default function BannerCarousel({ banners }) {
  if (!banners || banners.length === 0) return null;

  return (
    <Carousel autoplay>
      {banners.map((banner) => (
        <div key={banner.id} className="w-full h-[400px] flex items-center justify-center">
          <Image
            src={banner.image}
            alt={banner.title}
            preview={false}
            className="rounded-md object-cover w-full h-[400px]"
          />
        </div>
      ))}
    </Carousel>
  );
}
