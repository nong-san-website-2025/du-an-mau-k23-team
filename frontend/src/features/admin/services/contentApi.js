import axiosInstance from './axiosInstance';

export const listPages = async (params = {}) => {
  const res = await axiosInstance.get('/pages/', { params });
  return res.data;
};

export const getPage = async (slug) => {
  const res = await axiosInstance.get(`/pages/${slug}/`);
  return res.data;
};

export const savePage = async (slug, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v);
  });
  const res = await axiosInstance.patch(`/pages/${slug}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const createPage = async (data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v);
  });
  const res = await axiosInstance.post('/pages/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

// ----- Blocks (sections) -----
export const getBlocks = async (slug) => {
  const res = await axiosInstance.get(`/pages/${slug}/blocks/`);
  return res.data;
};

export const createBlock = async (slug, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v);
  });
  const res = await axiosInstance.post(`/pages/${slug}/blocks/create/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const updateBlock = async (id, data) => {
  const formData = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) formData.append(k, v);
  });
  const res = await axiosInstance.patch(`/pages/blocks/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const deleteBlock = async (id) => {
  const res = await axiosInstance.delete(`/pages/blocks/${id}/`);
  return res.data;
};
