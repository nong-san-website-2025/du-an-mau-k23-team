import React from 'react';
import {
  Input,
  Select,
  Typography,
  Space,
  Button,
} from 'antd';

const { Title } = Typography;
const { Option } = Select;

const FilterSidebar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedSubcategory,
  onSubcategoryChange,
  subcategoriesForSelected,
  uniqueBrands,
  selectedBrand,
  onBrandChange,
  uniqueLocations,
  selectedLocation,
  onLocationChange,
  priceRange,
  onPriceChange,
  onReset,
  search,
  onSearchChange,
}) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Title level={5}>Bộ lọc</Title>

      {search !== undefined && onSearchChange && (
        <Input
          placeholder="Tìm kiếm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      )}

      <Select
        placeholder="Danh mục"
        value={selectedCategory || undefined}
        onChange={(value) => {
          onCategoryChange(value);
          onSubcategoryChange('');
        }}
        style={{ width: '100%' }}
        allowClear
      >
        {categories.map((cat) => (
          <Option key={cat.id} value={cat.name}>
            {cat.name}
          </Option>
        ))}
      </Select>

      {selectedCategory && (
        <Select
          placeholder="Danh mục con"
          value={selectedSubcategory || undefined}
          onChange={onSubcategoryChange}
          style={{ width: '100%' }}
          allowClear
        >
          {subcategoriesForSelected.map((sub) => (
            <Option key={sub.id} value={sub.name}>
              {sub.name}
            </Option>
          ))}
        </Select>
      )}

      <Select
        placeholder="Thương hiệu"
        value={selectedBrand || undefined}
        onChange={onBrandChange}
        style={{ width: '100%' }}
        allowClear
      >
        {uniqueBrands.map((b) => (
          <Option key={b} value={b}>
            {b}
          </Option>
        ))}
      </Select>

      <Select
        placeholder="Vị trí"
        value={selectedLocation || undefined}
        onChange={onLocationChange}
        style={{ width: '100%' }}
        allowClear
      >
        {uniqueLocations.map((l) => (
          <Option key={l} value={l}>
            {l}
          </Option>
        ))}
      </Select>

      <Space>
        <Input
          type="number"
          placeholder="Min"
          value={priceRange[0]}
          onChange={(e) =>
            onPriceChange([Number(e.target.value), priceRange[1]])
          }
          style={{ width: '100px' }}
        />
        <Input
          type="number"
          placeholder="Max"
          value={priceRange[1]}
          onChange={(e) =>
            onPriceChange([priceRange[0], Number(e.target.value)])
          }
          style={{ width: '100px' }}
        />
      </Space>

      <Button type="default" onClick={onReset} block>
        Xoá bộ lọc
      </Button>
    </Space>
  );
};

export default FilterSidebar;
