import React from "react";
import { Table, Button, Badge } from "react-bootstrap";

const StaffTable = ({ employees, onEdit, onDelete }) => {
  return (
    <div className="table-responsive">
      <Table striped bordered hover className="align-middle">
        <thead className="table-success">
          <tr>
            <th>ID</th>
            <th>Họ tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {employees.length > 0 ? (
            employees.map((emp, index) => (
              <tr key={emp.id || index}>
                <td>#{emp.id}</td>
                <td>{emp.full_name || emp.username}</td>
                <td>{emp.email}</td>
                <td>{emp.phone || "—"}</td>
                <td>
                  {emp.is_active ? (
                    <Badge bg="success">Hoạt động</Badge>
                  ) : (
                    <Badge bg="secondary">Đã khóa</Badge>
                  )}
                </td>
                <td>
                                <Button 
                style={{ backgroundColor: "rgb(33,196,93)", border: "none" }} 
                size="sm" 
                onClick={() => onEdit(emp)}
                >
                ✏️ Sửa
                </Button>{" "}
                <Button 
                style={{ backgroundColor: "rgb(33,196,93)", border: "none" }} 
                size="sm" 
                onClick={() => onDelete(emp.id)}
                >
                🗑️ Xóa
                </Button>

                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center">
                Không có nhân viên nào
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default StaffTable;
