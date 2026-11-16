import { Fragment } from "react";
import { Link } from "react-router-dom";

/**
 * Đầu trang thống nhất: breadcrumb, tiêu đề, một dòng phụ đề ngắn, vùng nút bên phải.
 * crumbs: [{ label, to }]; actions: các nút (tối đa 1 nút primary).
 */
export default function PageHeader({ crumbs = [], title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {crumbs.length > 0 && (
          <nav className="page-crumbs" aria-label="Breadcrumb">
            {crumbs.map((crumb) => (
              <Fragment key={crumb.to}>
                <Link to={crumb.to}>{crumb.label}</Link>
                <span aria-hidden="true">/</span>
              </Fragment>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
