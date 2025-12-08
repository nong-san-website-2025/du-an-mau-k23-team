
import API from "../../login_register/services/api.js";

export const getBannersBySlot = (slotCode) =>
  API.get(`/marketing/banners/?slot=${slotCode}`);

export const getAdSlots = () => API.get("/marketing/slots/");
