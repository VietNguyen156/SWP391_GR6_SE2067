/** Khung chung cho form khóa học, tuần và bài: 1 cột, tối đa 760px, căn giữa. */
export default function FormPage({ title, error, children }) {
  return (
    <main className="container cs-page">
      <div className="cs-form-wrap">
        <header className="cs-form-head">
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
