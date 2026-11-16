import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Dropdown dùng class có sẵn của Bootstrap (dropdown-menu, dropdown-item), trạng thái do React giữ
 * nên không cần nạp bootstrap.js.
 * items: [{ label, to } | { label, onClick, danger, disabled, reason }] — reason giải thích vì sao bị khóa.
 */
export default function Dropdown({ label, ariaLabel, items, align = "end", toggleClassName = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const root = rootRef.current;
    function onPointerDown(event) {
      if (!root?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    root?.querySelector(".dropdown-item")?.focus();
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function moveFocus(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const options = [...rootRef.current.querySelectorAll(".dropdown-item")];
    const index = options.indexOf(document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    options[(index + step + options.length) % options.length]?.focus();
  }

  return (
    <div className="dropdown cs-dropdown" ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className={toggleClassName}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open && (
        <ul
          id={menuId}
          className={`dropdown-menu show cs-dropdown-menu ${align === "end" ? "is-end" : ""}`}
          role="menu"
          onKeyDown={moveFocus}
        >
          {items.map((item) => (
            <li key={item.label} role="none">
              {item.to ? (
                <Link
                  role="menuitem"
                  className="dropdown-item"
                  to={item.to}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  className={`dropdown-item ${item.danger ? "is-danger" : ""} ${item.disabled ? "is-disabled" : ""}`}
                  aria-disabled={item.disabled || undefined}
                  title={item.disabled ? item.reason : undefined}
                  onClick={() => {
                    if (item.disabled) return;
                    setOpen(false);
                    item.onClick();
                  }}
                >
                  {item.label}
                  {item.disabled && item.reason && (
                    <small className="dropdown-item-reason">{item.reason}</small>
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
