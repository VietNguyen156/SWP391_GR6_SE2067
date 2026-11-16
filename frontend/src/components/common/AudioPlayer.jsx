import { useEffect, useState } from "react";
import axiosClient from "../../services/axiosClient";

export default function AudioPlayer({ endpoint, className = "w-100 my-2" }) {
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!endpoint) return;
    const controller = new AbortController();
    let objectUrl = "";
    setSource("");
    setError("");

    axiosClient
      .get(endpoint, { responseType: "blob", signal: controller.signal, timeout: 120000 })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(data);
        setSource(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("Không thể tải file âm thanh.");
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [endpoint, retry]);

  if (!endpoint) return null;
  if (error)
    return (
      <div className="small text-danger">
        {error}{" "}
        <button
          type="button"
          className="btn btn-link btn-sm"
          onClick={() => setRetry((value) => value + 1)}
        >
          Thử lại
        </button>
      </div>
    );
  if (!source) return <span className="small text-secondary">Đang tải âm thanh…</span>;
  return (
    <audio
      className={className}
      controls
      preload="metadata"
      src={source}
      onError={() => setError("Không thể phát file âm thanh.")}
    />
  );
}
