// import React, { createContext, useContext, useState, useEffect } from "react";

// const PreOrderContext = createContext();

// export const usePreOrder = () => useContext(PreOrderContext);

// export const PreOrderProvider = ({ children }) => {
//   const [preOrders, setPreOrders] = useState(() => {
//     const saved = localStorage.getItem("preOrders");
//     return saved ? JSON.parse(saved) : [];
//   });

//   useEffect(() => {
//     localStorage.setItem("preOrders", JSON.stringify(preOrders));
//   }, [preOrders]);

//   const addPreOrder = (product) => {
//     setPreOrders((prev) => {
//       const exists = prev.find((p) => p.id === product.id);
//       if (exists) return prev; // tránh trùng
//       return [...prev, product];
//     });
//   };

//   const removePreOrder = (id) => {
//     setPreOrders((prev) => prev.filter((p) => p.id !== id));
//   };

//   return (
//     <PreOrderContext.Provider value={{ preOrders, addPreOrder, removePreOrder }}>
//       {children}
//     </PreOrderContext.Provider>
//   );
// };
