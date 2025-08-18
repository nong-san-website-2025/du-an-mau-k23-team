import React, { useEffect, useState } from "react";
import StaffTable from "../../admin/components/EmployeeManagerment/StaffTable";
import StaffForm from "../../admin/components/EmployeeManagerment/StaffForm";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../services/staffService";
import { Button, Form } from "react-bootstrap";

const StaffPage = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    const res = await getEmployees();
    setEmployees(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (data) => {
    if (selected) {
      await updateEmployee(selected.id, data);
    } else {
      await createEmployee(data);
    }
    loadData();
    setSelected(null);
  };

  const handleDelete = async (id) => {
    await deleteEmployee(id);
    loadData();
  };

  // lọc danh sách nhân viên theo tên
  const filteredEmployees = employees.filter(emp =>
    emp.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3">
      <h2>Quản lý Nhân viên</h2>

      {/* Thanh tìm kiếm */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Control
          type="text"
          placeholder="Tìm kiếm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "250px" }}   // ✅ thu ngắn chiều dài
        />
      </div>

      <Button
        className="mb-3"
        style={{ backgroundColor: "rgb(33, 196, 93)", border: "none" }}
        onClick={() => setShowForm(true)}
      >
        + Thêm nhân viên
      </Button>

      <StaffTable
        employees={filteredEmployees}
        onEdit={(emp) => { setSelected(emp); setShowForm(true); }}
        onDelete={handleDelete}
      />

      <StaffForm
        show={showForm}
        onHide={() => { setShowForm(false); setSelected(null); }}
        onSave={handleSave}
        selected={selected}
      />
    </div>
  );
};

export default StaffPage;
