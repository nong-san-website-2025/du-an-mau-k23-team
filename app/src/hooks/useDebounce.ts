import { useState, useEffect } from 'react';

// <T> giúp hook này dùng được cho cả string, number, object...
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Tạo bộ đếm ngược
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp bộ đếm nếu value thay đổi trước khi hết giờ (user gõ tiếp)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}