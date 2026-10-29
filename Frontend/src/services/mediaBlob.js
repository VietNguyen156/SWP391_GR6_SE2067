import axiosClient from "./axiosClient";

const starts = (bytes, signature) => signature.every((value, index) => bytes[index] === value);

async function errorMessage(blob, fallback) {
  if (!(blob instanceof Blob)) return fallback;
  const type = blob.type.toLowerCase();
  if (!type.includes("json") && !type.includes("text") && !type.includes("html")) return fallback;
  try {
    const body = await blob.text();
    if (type.includes("json")) return JSON.parse(body).message || fallback;
  } catch {
    // A malformed server response is still an error, not a media file.
  }
  return fallback;
}

export async function mediaError(error, fallback) {
  return errorMessage(error?.response?.data, error?.response?.data?.message || fallback);
}

export async function validateMediaBlob(blob, kind = "file") {
  if (!(blob instanceof Blob) || !blob.size) throw new Error("Tệp tải về trống.");
  const type = blob.type.toLowerCase();
  if (type.includes("json") || type.includes("html") || type.includes("text/plain")) {
    throw new Error(await errorMessage(blob, "Máy chủ trả về thông báo lỗi thay vì tệp."));
  }
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const text = (value) => [...value].map((ch) => ch.charCodeAt(0));
  if (kind === "pdf") {
    const tail = await blob.slice(Math.max(0, blob.size - 2048)).text();
    if (!starts(head, text("%PDF-")) || !tail.includes("startxref") || !tail.includes("%%EOF"))
      throw new Error("Tệp PDF bị hỏng. Vui lòng báo giáo viên tải lại bản gốc.");
  } else if (kind === "audio") {
    const valid =
      starts(head, text("ID3")) ||
      (head[0] === 0xff && (head[1] & 0xe0) === 0xe0) ||
      (starts(head, text("RIFF")) && starts(head.slice(8), text("WAVE"))) ||
      starts(head, text("OggS")) ||
      starts(head, [0x1a, 0x45, 0xdf, 0xa3]) ||
      starts(head.slice(4), text("ftyp"));
    if (!valid) throw new Error("Tệp âm thanh bị hỏng hoặc không đúng định dạng.");
  }
  return blob;
}

export async function getMediaBlob(endpoint, kind = "file", options = {}) {
  let response;
  try {
    response = await axiosClient.get(endpoint, {
      responseType: "blob",
      timeout: 120000,
      ...options,
    });
  } catch (error) {
    throw new Error(await mediaError(error, "Không thể tải tệp. Vui lòng thử lại."));
  }
  return validateMediaBlob(response.data, kind);
}
