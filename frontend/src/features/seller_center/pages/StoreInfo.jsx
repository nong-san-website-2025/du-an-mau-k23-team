"use client"

import { useEffect, useMemo, useState } from "react"
import sellerService from "../services/api/sellerService"

export default function StoreManagement() {
  // Keep UI minimal and focused on fields that exist in backend Seller model
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sellerId, setSellerId] = useState(null)

  const [form, setForm] = useState({
    store_name: "",
    bio: "",
    address: "",
    phone: "",
    image: null, // current image URL
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await sellerService.getMe()
        if (!mounted) return
        setSellerId(me.id)
        setForm({
          store_name: me.store_name || "",
          bio: me.bio || "",
          address: me.address || "",
          phone: me.phone || "",
          image: me.image || null,
        })
      } catch (e) {
        console.error(e)
        alert("Không thể tải thông tin cửa hàng của bạn")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile)
    if (form.image) return form.image
    return null
  }, [imageFile, form.image])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setImageFile(file)
  }

  const handleSave = async () => {
    if (!sellerId) return
    try {
      setSaving(true)
      // Build payload
      let payload
      if (imageFile) {
        payload = new FormData()
        payload.append("store_name", form.store_name)
        payload.append("bio", form.bio)
        payload.append("address", form.address)
        payload.append("phone", form.phone)
        payload.append("image", imageFile)
      } else {
        payload = {
          store_name: form.store_name,
          bio: form.bio,
          address: form.address,
          phone: form.phone,
        }
      }
      const updated = await sellerService.update(sellerId, payload)
      setForm((prev) => ({
        ...prev,
        store_name: updated.store_name || prev.store_name,
        bio: updated.bio ?? prev.bio,
        address: updated.address ?? prev.address,
        phone: updated.phone ?? prev.phone,
        image: updated.image ?? prev.image,
      }))
      setImageFile(null)
      alert("Đã lưu thay đổi thông tin cửa hàng")
    } catch (e) {
      console.error(e)
      alert("Lưu thất bại. Vui lòng thử lại!")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>
        <p className="text-muted">Đang tải thông tin cửa hàng...</p>
      </div>
    )
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <div className="p-3 rounded-3 me-3" style={{ backgroundColor: "rgba(22, 78, 99, 0.1)" }}>
          <span className="icon icon-shop" style={{ fontSize: "2rem" }}></span>
        </div>
        <div>
          <h1 className="h4 fw-bold text-dark mb-1">Cài đặt Cửa hàng</h1>
          <p className="text-muted mb-0">Chỉnh sửa thông tin sẽ được đồng bộ sang trang cửa hàng</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Logo */}
        <div className="col-lg-4">
          <div className="card agricultural-card h-100">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0">
                <span className="icon icon-image me-2 text-primary"></span>
                Logo cửa hàng
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3 text-center">
                <div
                  className="border border-2 border-dashed rounded-3 p-3"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="logo preview"
                      style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }}
                    />
                  ) : (
                    <div className="text-muted small">Chưa có logo</div>
                  )}
                </div>
              </div>
              <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} />
              <small className="text-muted">PNG/JPG tối đa 2MB</small>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="col-lg-8">
          <div className="card agricultural-card h-100">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1">
                  <span className="icon icon-shop me-2 text-primary"></span>
                  Thông tin cửa hàng
                </h5>
                <p className="text-muted small mb-0">Chỉ giữ các trường cần thiết: Tên, Mô tả, Địa chỉ, SĐT</p>
              </div>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Tên cửa hàng</label>
                <input
                  type="text"
                  name="store_name"
                  className="form-control"
                  value={form.store_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Mô tả</label>
                <textarea
                  name="bio"
                  className="form-control"
                  rows={3}
                  value={form.bio}
                  onChange={handleChange}
                />
              </div>

              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    className="form-control"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="card-footer bg-transparent border-0 d-flex justify-content-end">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}