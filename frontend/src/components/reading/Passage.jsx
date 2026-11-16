import { useEffect, useId, useMemo, useRef, useState } from "react";
import { markInline, parseMarkdown, plainText, splitDocuments } from "../../utils/markdown";

// Đoạn văn Reading render từ Markdown đã giới hạn (utils/markdown) thành phần tử React: không dùng
// dangerouslySetInnerHTML, mọi HTML trong bài hiện như chữ thường.

function Inline({ parts, focus }) {
  return parts.map((part, i) => {
    let node = part.text;
    if (part.italic) node = <em>{node}</em>;
    if (part.bold) node = <strong>{node}</strong>;
    if (part.mark !== undefined)
      node = (
        <mark className={part.mark === focus ? "is-focus" : ""} data-mark={part.mark}>
          {node}
        </mark>
      );
    return <span key={i}>{node}</span>;
  });
}

function Block({ block, marks, focus }) {
  const mark = (inline) => <Inline parts={markInline(inline, marks)} focus={focus} />;
  switch (block.type) {
    case "h": {
      const Tag = `h${Math.min(block.level + 2, 5)}`;
      return <Tag className="rp-heading">{mark(block.inline)}</Tag>;
    }
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}>{mark(item)}</li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="rp-table">
          <table>
            <thead>
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col">
                    {mark(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, i) => (
                    <td key={i}>{mark(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return <p className="pre-line">{mark(block.inline)}</p>;
  }
}

/**
 * passage / format: nội dung bài; multi: DOUBLE / TRIPLE → tab "Văn bản 1 / 2 / 3".
 * marks: các đoạn trích cần tô sáng (theo thứ tự câu hỏi); focus: chỉ số câu đang xem căn cứ —
 * chuyển sang đúng tab và cuộn tới đoạn đó.
 */
export default function Passage({ passage, format, multi = false, marks = [], focus = null }) {
  const docs = useMemo(() => {
    const blocks = parseMarkdown(passage || "", format);
    return multi ? splitDocuments(blocks) : [blocks];
  }, [passage, format, multi]);
  const [tab, setTab] = useState(0);
  const root = useRef(null);
  const tabsId = useId();

  // Tab chứa đoạn trích của câu đang xem.
  const docOf = (index) =>
    docs.findIndex((blocks) => plainText(blocks).includes(marks[index].trim()));

  useEffect(() => {
    if (focus === null || !marks[focus]) return;
    const doc = docs.length > 1 ? docOf(focus) : 0;
    if (doc >= 0) setTab(doc);
    // Chờ tab mới render rồi mới cuộn.
    requestAnimationFrame(() =>
      root.current
        ?.querySelector(`mark[data-mark="${focus}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }, [focus, docs]);

  if (!docs[0]?.length) return null;
  const current = Math.min(tab, docs.length - 1);
  return (
    <div className="rp-passage" ref={root}>
      {docs.length > 1 && (
        <div className="rp-tabs" role="tablist" aria-label="Các văn bản">
          {docs.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${i}`}
              aria-selected={i === current}
              aria-controls={`${tabsId}-panel`}
              className={i === current ? "is-active" : ""}
              onClick={() => setTab(i)}
            >
              Văn bản {i + 1}
            </button>
          ))}
        </div>
      )}
      <div
        id={`${tabsId}-panel`}
        role={docs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={docs.length > 1 ? `${tabsId}-tab-${current}` : undefined}
        className="rp-doc"
      >
        {docs[current].map((block, i) => (
          <Block key={i} block={block} marks={marks} focus={focus} />
        ))}
      </div>
    </div>
  );
}
