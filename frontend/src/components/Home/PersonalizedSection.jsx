import React from "react";

export default function PersonalizedSection({ username, recommended = [], vouchers = [] }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4">
        Gợi ý cho {username}
      </h2>

      <div className="grid grid-cols-4 gap-4">
        {recommended.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg shadow hover:shadow-xl transition cursor-pointer"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-40 object-cover rounded-md mb-2"
            />
            <h3 className="text-sm font-medium truncate">{item.name}</h3>
            <p className="text-red-500 font-bold">{item.price} đ</p>
          </div>
        ))}
      </div>
    </div>
  );
}
