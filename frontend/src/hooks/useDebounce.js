import { useEffect, useState } from 'react';

/**
 * Custom hook để debounce một giá trị
 * @param {any} value - Giá trị cần debounce
 * @param {number} delay - Thời gian delay tính bằng milliseconds (mặc định 500)
 * @returns {any} - Giá trị đã được debounce
 */
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Thiết lập timeout để cập nhật giá trị sau delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: hủy timeout nếu component unmount hoặc value thay đổi
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
