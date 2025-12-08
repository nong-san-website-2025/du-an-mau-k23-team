import React from "react";
import { Link } from "react-router-dom";
import { Image } from "antd"; // Import Image từ Ant Design
import PropTypes from "prop-types";
import "../../styles/home/CategorySections.css";

const CategoryItem = React.memo(({ name, image, link }) => {
  return (
    <Link to={link} className="category-item">
      <div className="category-icon-wrapper">
        <Image
          src={image}
          alt={name}
          className="category-img"
          // Tắt preview để khi click vào ảnh thì Link vẫn hoạt động
          preview={false}
          // Bỏ fallback custom, Ant Design sẽ xử lý mặc định
        />
      </div>
      <span className="category-name" title={name}>
        {name}
      </span>
    </Link>
  );
});

CategoryItem.propTypes = {
  name: PropTypes.string.isRequired,
  image: PropTypes.string,
  link: PropTypes.string.isRequired,
};

export default CategoryItem;