import { Fragment } from "react";
import { Link } from "react-router-dom";

/** Khung chung cho form khóa học, tuần và bài: 1 cột, tối đa 760px, căn giữa. */
export default function FormPage({ crumbs = [], title, error, children }) {
  return (
    <main className="container cs-page">
      <div className="cs-form-wrap">
        <header className="cs-form-head">
          {crumbs.length > 0 && (
            <nav className="cs-breadcrumb" aria-label="Breadcrumb">
              {crumbs.map((crumb) => (
                <Fragment key={crumb.to}>
                  <Link to={crumb.to}>{crumb.label}</Link>
                  <span aria-hidden="true"> / </span>
                </Fragment>
              ))}
            </nav>
          )}
          <h1 className="cs-title">{title}</h1>
        </header>
        {error && (
          <div className="alert alert-danger cs-alert" role="alert">
            {error}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
