import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "../common/Icon";
import { adminOrderApi } from "../../services/orderService";

/** Phát sau khi admin đổi trạng thái đơn để badge "Đơn hàng" cập nhật ngay. */
export const ORDERS_CHANGED = "admin-orders-changed";
const links = [
  ["/admin", "Tổng quan", "dashboard"],
  ["/admin/users", "Người dùng", "users"],
  ["/admin/courses", "Khóa học", "courses"],
  ["/admin/classes", "Lớp học", "book"],
  ["/admin/reports", "Báo cáo", "reports"],
  ["/admin/orders", "Đơn hàng", "receipt"],
  ["/admin/revenue", "Doanh thu", "results"],
  ["/admin/payment-settings", "Cài đặt thanh toán", "wallet"],
];

function useAwaitingCount() {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    const load = () =>
      adminOrderApi
        .counts()
        .then((data) => active && setCount(data.awaitingConfirmation))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener(ORDERS_CHANGED, load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener(ORDERS_CHANGED, load);
    };
  }, [pathname]);
  return count;
}
export default function AdminSidebar() {
  const awaiting = useAwaitingCount();
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-title">
        <strong>Admin Console</strong>
      </div>
      <nav>
        {links.map(([to, label, icon]) => (
          <NavLink key={to} to={to} end={to === "/admin"}>
            <Icon name={icon} />
            <span>{label}</span>
            {to === "/admin/orders" && awaiting > 0 && (
              <b className="admin-nav-badge" aria-label={`${awaiting} đơn chờ xác nhận`}>
                {awaiting}
              </b>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
