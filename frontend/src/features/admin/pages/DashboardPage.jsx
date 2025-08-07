import React from "react";
import RevenueChart from "../components/RevenueChart";
import OrderPieChart from "../components/OrderPieChart";

export default function DashboardPage() {
  return (
    <div className="bg-light" style={{minHeight:'100vh'}}>
      <div style={{marginLeft:0}}>
        <div className="container-fluid py-4">
          <h2 className="fw-bold mb-4">Projects</h2>
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">18</div>
                  <div className="text-muted">Projects</div>
                  <div className="small text-success">2 Completed</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">132</div>
                  <div className="text-muted">Active Task</div>
                  <div className="small text-primary">28 Completed</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">12</div>
                  <div className="text-muted">Teams</div>
                  <div className="small text-info">1 Completed</div>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="fs-3 fw-bold">76%</div>
                  <div className="text-muted">Productivity</div>
                  <div className="small text-warning">5% Completed</div>
                </div>
              </div>
            </div>
          </div>
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <RevenueChart />
            </div>
            <div className="col-md-6 mb-3">
              <OrderPieChart />
            </div>
          </div>
          <h4 className="fw-bold mb-3">Active Projects</h4>
          <div className="card shadow-sm">
            <div className="card-body p-0">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Hours</th>
                    <th>Priority</th>
                    <th>Members</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Dropbox Design System</td>
                    <td>34</td>
                    <td><span className="badge bg-warning text-dark">Medium</span></td>
                    <td><span className="badge bg-info">+5</span></td>
                    <td><div className="progress" style={{height:6}}><div className="progress-bar bg-primary" style={{width:'15%'}}></div></div></td>
                  </tr>
                  <tr>
                    <td>Slack Team UI Design</td>
                    <td>47</td>
                    <td><span className="badge bg-danger">High</span></td>
                    <td><span className="badge bg-info">+5</span></td>
                    <td><div className="progress" style={{height:6}}><div className="progress-bar bg-success" style={{width:'35%'}}></div></div></td>
                  </tr>
                  <tr>
                    <td>GitHub Satellite</td>
                    <td>120</td>
                    <td><span className="badge bg-primary">Low</span></td>
                    <td><span className="badge bg-info">+5</span></td>
                    <td><div className="progress" style={{height:6}}><div className="progress-bar bg-info" style={{width:'75%'}}></div></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
