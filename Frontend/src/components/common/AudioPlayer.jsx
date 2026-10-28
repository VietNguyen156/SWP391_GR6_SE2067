import { useEffect, useRef, useState } from "react";
import { getMediaBlob } from "../../services/mediaBlob";
import Icon from "./Icon";

function formatAudioTime(seconds) {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AudioPlayer({ endpoint, src, className = "my-2" }) {
  const audioRef = useRef(null);
  const [source, setSource] = useState(src || "");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Tải audio từ endpoint qua axios blob (đính kèm auth token)
  useEffect(() => {
    if (src) {
      setSource(src);
      return;
    }
    if (!endpoint) return;

    const controller = new AbortController();
    let objectUrl = "";
    setSource("");
    setError("");

    getMediaBlob(endpoint, "audio", { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(data);
        setSource(objectUrl);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message || "Không thể tải file âm thanh.");
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [endpoint, src, retry]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [source]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  function seek(deltaSeconds) {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration || 0, audio.currentTime + deltaSeconds));
    audio.currentTime = target;
    setCurrentTime(target);
  }

  function handleScrub(e) {
    const audio = audioRef.current;
    if (!audio) return;
    const target = parseFloat(e.target.value);
    audio.currentTime = target;
    setCurrentTime(target);
  }

  function changeSpeed(rate) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    setPlaybackRate(rate);
  }

  if (!endpoint && !src) return null;
  if (error)
    return (
      <div className="alert alert-danger py-2 px-3 small d-flex align-items-center justify-content-between">
        <span>{error}</span>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => setRetry((v) => v + 1)}
        >
          Thử lại
        </button>
      </div>
    );

  if (!source)
    return (
      <div className="ui-audio-loading p-3 text-center text-muted">
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
        Đang tải file âm thanh…
      </div>
    );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`ui-custom-audio-player ${className}`.trim()}>
      <audio
        ref={audioRef}
        src={source}
        preload="metadata"
        onError={() => setError("Không thể phát file âm thanh.")}
      />

      {/* Dải điều khiển chính */}
      <div className="audio-player-controls">
        {/* Nút tua lùi 5s */}
        <button
          type="button"
          className="audio-control-btn audio-skip-btn"
          onClick={() => seek(-5)}
          title="Lùi lại 5 giây"
          aria-label="Lùi lại 5 giây"
        >
          <span className="audio-skip-text">-5s</span>
        </button>

        {/* Nút Play / Pause lớn */}
        <button
          type="button"
          className="audio-control-btn audio-play-btn"
          onClick={togglePlay}
          title={isPlaying ? "Tạm dừng" : "Phát audio"}
          aria-label={isPlaying ? "Tạm dừng" : "Phát audio"}
        >
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Nút tua tới 5s */}
        <button
          type="button"
          className="audio-control-btn audio-skip-btn"
          onClick={() => seek(5)}
          title="Tua tới 5 giây"
          aria-label="Tua tới 5 giây"
        >
          <span className="audio-skip-text">+5s</span>
        </button>

        {/* Thanh thời gian & sóng âm */}
        <div className="audio-timeline-wrap">
          <div className="audio-time-row">
            <span className="audio-time-current">{formatAudioTime(currentTime)}</span>
            <span className="audio-time-total">{formatAudioTime(duration)}</span>
          </div>
          <div className="audio-scrubber-track">
            <div className="audio-scrubber-progress" style={{ width: `${progressPercent}%` }} />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleScrub}
              className="audio-scrubber-input"
              aria-label="Thanh trượt thời gian âm thanh"
            />
          </div>
        </div>

        {/* Chọn tốc độ 0.75x / 1x / 1.25x */}
        <div className="audio-speed-selector" title="Tốc độ phát">
          {[0.75, 1, 1.25].map((rate) => (
            <button
              key={rate}
              type="button"
              className={`audio-speed-btn ${playbackRate === rate ? "is-active" : ""}`}
              onClick={() => changeSpeed(rate)}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
