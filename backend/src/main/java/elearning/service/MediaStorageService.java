package elearning.service;

import org.apache.pdfbox.Loader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.dao.DataAccessException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;

@Service
public class MediaStorageService {
    private static final Logger log = LoggerFactory.getLogger(MediaStorageService.class);
    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".mp3", ".wav", ".m4a", ".webm", ".ogg");
    private static final List<String> IMAGE_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");
    private final Path root;
    private JdbcTemplate database;

    @Autowired(required = false)
    public void setDatabase(JdbcTemplate database) {
        this.database = database;
    }

    public MediaStorageService(
            @Value("${app.upload-dir:${user.home}/toeic-path-data/uploads}") String dir) {
        root = Paths.get(dir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
            log.info("Media upload directory: {}", root);
        } catch (IOException e) {
            throw new IllegalStateException("Không thể tạo thư mục lưu file", e);
        }
    }

    public String store(MultipartFile file, String category) throws IOException {
        if (file == null || file.isEmpty())
            throw new IllegalArgumentException("Vui lòng chọn file âm thanh");

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            String normalizedType = contentType.toLowerCase(Locale.ROOT);
            boolean browserAudio =
                    normalizedType.startsWith("audio/")
                            || normalizedType.contains("webm")
                            || normalizedType.contains("ogg");
            if (!browserAudio)
                throw new IllegalArgumentException("File tải lên phải là file âm thanh");
        }

        String original = file.getOriginalFilename() == null ? "audio" : file.getOriginalFilename();
        String ext = extension(original);
        if (!ALLOWED_EXTENSIONS.contains(ext)) ext = extensionFromMime(contentType);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("Chỉ hỗ trợ MP3, WAV, M4A, WEBM hoặc OGG");
        }

        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(16);
        }
        if (!contentMatches(ext, head, head.length))
            throw new IllegalArgumentException("Tệp âm thanh bị hỏng hoặc không đúng định dạng");

        return write(file, category, ext);
    }

    /** Ảnh (JPG / PNG / WEBP) tối đa maxBytes, ví dụ ảnh biên lai chuyển khoản. */
    public String storeImage(MultipartFile file, String category, long maxBytes) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Vui lòng chọn ảnh");
        if (file.getSize() > maxBytes)
            throw new IllegalArgumentException(
                    "Ảnh vượt quá " + (maxBytes / (1024 * 1024)) + " MB. Vui lòng chọn ảnh nhỏ hơn");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/"))
            throw new IllegalArgumentException("File tải lên phải là ảnh");
        String ext =
                extension(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        if (!IMAGE_EXTENSIONS.contains(ext))
            throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
        return write(file, category, ext);
    }

    /** Định dạng tệp đính kèm Ngữ pháp được phép: đuôi file → MIME trả về khi xem/tải. */
    static final Map<String, String> ATTACHMENT_TYPES =
            Map.ofEntries(
                    Map.entry(".pdf", "application/pdf"),
                    Map.entry(".doc", "application/msword"),
                    Map.entry(
                            ".docx",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                    Map.entry(".ppt", "application/vnd.ms-powerpoint"),
                    Map.entry(
                            ".pptx",
                            "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
                    Map.entry(".xls", "application/vnd.ms-excel"),
                    Map.entry(
                            ".xlsx",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                    Map.entry(".png", "image/png"),
                    Map.entry(".jpg", "image/jpeg"),
                    Map.entry(".jpeg", "image/jpeg"),
                    Map.entry(".webp", "image/webp"),
                    Map.entry(".mp3", "audio/mpeg"),
                    Map.entry(".m4a", "audio/mp4"),
                    Map.entry(".wav", "audio/wav"),
                    Map.entry(".mp4", "video/mp4"));

    public static final long MAX_ATTACHMENT_BYTES = 20L * 1024 * 1024;

    public record StoredFile(String url, String fileName, String mimeType, long sizeBytes) {}

    /**
     * Tệp đính kèm Ngữ pháp: kiểm tra cả đuôi file lẫn nội dung thật (magic bytes), không tin
     * Content-Type từ trình duyệt. Tên trên đĩa là UUID; tên gốc trả về để lưu vào file_name.
     */
    public StoredFile storeAttachment(MultipartFile file, String category) throws IOException {
        return storeAttachment(
                file,
                category,
                ATTACHMENT_TYPES.keySet(),
                "Định dạng không được hỗ trợ. Chỉ nhận PDF, Word, PowerPoint, Excel, ảnh (PNG, JPG, WEBP), âm thanh (MP3, M4A, WAV) hoặc video MP4");
    }

    /** Như trên nhưng chỉ nhận các đuôi trong `allowed` (vd. Reading: pdf, Word, ảnh). */
    public StoredFile storeAttachment(
            MultipartFile file, String category, java.util.Set<String> allowed, String typeError)
            throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Vui lòng chọn file");
        if (file.getSize() > MAX_ATTACHMENT_BYTES)
            throw new IllegalArgumentException("File vượt quá 20 MB. Vui lòng chọn file nhỏ hơn");
        String original =
                Paths.get(file.getOriginalFilename() == null ? "" : file.getOriginalFilename())
                        .getFileName()
                        .toString();
        String ext = extension(original);
        String mime = allowed.contains(ext) ? ATTACHMENT_TYPES.get(ext) : null;
        if (mime == null) throw new IllegalArgumentException(typeError);
        byte[] head = new byte[16];
        int read;
        try (var in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        }
        if (!contentMatches(ext, head, read))
            throw new IllegalArgumentException(
                    "Nội dung file không khớp với đuôi " + ext + ". Vui lòng chọn đúng file");
        if (".pdf".equals(ext)) validatePdf(file.getBytes());
        String url = write(file, category, ext);
        return new StoredFile(url, original.length() > 255 ? original.substring(0, 255) : original, mime, file.getSize());
    }

    /** So chữ ký đầu file với đuôi. ponytail: docx/pptx/xlsx chỉ kiểm tra là file ZIP. */
    static boolean contentMatches(String ext, byte[] b, int n) {
        return switch (ext) {
            case ".pdf" -> starts(b, n, "%PDF-");
            case ".doc", ".ppt", ".xls" ->
                    starts(b, n, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1);
            case ".docx", ".pptx", ".xlsx" -> starts(b, n, 0x50, 0x4B, 0x03, 0x04);
            case ".png" -> starts(b, n, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case ".jpg", ".jpeg" -> starts(b, n, 0xFF, 0xD8, 0xFF);
            case ".webp" -> starts(b, n, "RIFF") && at(b, n, 8, "WEBP");
            case ".wav" -> starts(b, n, "RIFF") && at(b, n, 8, "WAVE");
            case ".mp3" ->
                    starts(b, n, "ID3") || (n >= 2 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xE0) == 0xE0);
            case ".mp4", ".m4a" -> at(b, n, 4, "ftyp");
            case ".webm" -> starts(b, n, 0x1A, 0x45, 0xDF, 0xA3);
            case ".ogg" -> starts(b, n, "OggS");
            default -> false;
        };
    }

    private static boolean starts(byte[] b, int n, String text) {
        return at(b, n, 0, text);
    }

    private static boolean at(byte[] b, int n, int offset, String text) {
        byte[] t = text.getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        if (n < offset + t.length) return false;
        for (int i = 0; i < t.length; i++) if (b[offset + i] != t[i]) return false;
        return true;
    }

    private static boolean starts(byte[] b, int n, int... sig) {
        if (n < sig.length) return false;
        for (int i = 0; i < sig.length; i++) if ((b[i] & 0xFF) != sig[i]) return false;
        return true;
    }

    /** Xóa file đã lưu; không có file thì bỏ qua. */
    public void delete(String storedUrl) {
        if (database != null) {
            try {
                Integer references = database.queryForObject(
                        "SELECT COUNT(*) FROM test_sections s JOIN test_versions v ON v.id=s.version_id WHERE v.status IN ('PUBLISHED','SUPERSEDED') AND JSON_SEARCH(s.snapshot_json,'one',?) IS NOT NULL",
                        Integer.class, storedUrl);
                if (references != null && references > 0) return;
            } catch (DataAccessException error) {
                log.warn("Cannot verify whether Test still uses media {}; preserving file", storedUrl, error);
                return;
            }
        }
        try {
            Files.deleteIfExists(resolveStoredPath(storedUrl));
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not delete media file {}: {}", storedUrl, e.getMessage());
        }
    }

    private String write(MultipartFile file, String category, String ext) throws IOException {
        Path dir = root.resolve(category).normalize();
        if (!dir.startsWith(root))
            throw new IllegalArgumentException("Thư mục lưu file không hợp lệ");
        Files.createDirectories(dir);

        String name = UUID.randomUUID() + ext;
        Path destination = dir.resolve(name).normalize();
        if (!destination.startsWith(dir))
            throw new IllegalArgumentException("Tên file không hợp lệ");
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        log.info("Stored media file at {}", destination);
        return "/uploads/" + category + "/" + name;
    }

    public Resource load(String storedUrl) {
        try {
            Path path = resolveStoredPath(storedUrl);
            if (!Files.exists(path) || !Files.isReadable(path)) {
                Path migrated = recoverLegacyFile(storedUrl, path);
                if (migrated != null) path = migrated;
            }

            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                log.warn(
                        "Media file is missing. storedUrl={}, expectedPath={}",
                        storedUrl,
                        path);
                throw new IllegalArgumentException("Không tìm thấy tệp trên máy chủ");
            }
            String ext = extension(path.getFileName().toString());
            if (".pdf".equals(ext)) {
                try {
                    validatePdf(Files.readAllBytes(path));
                } catch (IOException e) {
                    throw new IllegalArgumentException("Không thể đọc tệp PDF trên máy chủ", e);
                }
            } else if (ALLOWED_EXTENSIONS.contains(ext)) {
                try (InputStream in = Files.newInputStream(path)) {
                    byte[] head = in.readNBytes(16);
                    if (!contentMatches(ext, head, head.length))
                        throw new IllegalArgumentException("Tệp âm thanh bị hỏng hoặc không đúng định dạng");
                } catch (IOException e) {
                    throw new IllegalArgumentException("Không thể đọc tệp âm thanh trên máy chủ", e);
                }
            }
            return resource;
        } catch (java.net.MalformedURLException e) {
            throw new IllegalArgumentException("Không thể đọc tệp trên máy chủ", e);
        }
    }

    private static void validatePdf(byte[] bytes) {
        try (var document = Loader.loadPDF(bytes)) {
            if (document.getNumberOfPages() < 1)
                throw new IllegalArgumentException("Tệp PDF không có trang nào");
        } catch (IOException e) {
            throw new IllegalArgumentException("Tệp PDF bị hỏng hoặc không thể mở. Vui lòng tải lên bản gốc hợp lệ", e);
        }
    }

    public String contentType(String storedUrl) {
        Path path;
        try {
            path = resolveStoredPath(storedUrl);
            if (!Files.exists(path)) {
                Path migrated = recoverLegacyFile(storedUrl, path);
                if (migrated != null) path = migrated;
            }
        } catch (Exception e) {
            return "application/octet-stream";
        }
        String ext = extension(path.getFileName().toString());
        String audioType = switch (ext) {
            case ".mp3" -> "audio/mpeg";
            case ".wav" -> "audio/wav";
            case ".m4a" -> "audio/mp4";
            case ".webm" -> "audio/webm";
            case ".ogg" -> "audio/ogg";
            default -> null;
        };
        if (audioType != null) return audioType;
        try {
            String type = Files.probeContentType(path);
            return type == null ? "application/octet-stream" : type;
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    private Path resolveStoredPath(String storedUrl) {
        if (storedUrl == null || !storedUrl.startsWith("/uploads/")) {
            throw new IllegalArgumentException("Đường dẫn file không hợp lệ");
        }
        String relative = storedUrl.substring("/uploads/".length());
        if (relative.isBlank() || relative.contains("..")) {
            throw new IllegalArgumentException("Đường dẫn file không hợp lệ");
        }
        Path path = root.resolve(relative).normalize();
        if (!path.startsWith(root))
            throw new IllegalArgumentException("Đường dẫn file không hợp lệ");
        return path;
    }

    /**
     * During local development the project has been extracted into several versioned folders. Older
     * builds stored recordings in backend/uploads, so the database URL still exists while the
     * physical file remains in the previous project folder. If a requested recording is missing
     * from the stable upload directory, look for that exact relative uploads path in common local
     * development locations once and copy it into the stable directory. New uploads never depend on
     * project location.
     */
    private Path recoverLegacyFile(String storedUrl, Path destination) {
        String relativeText =
                storedUrl.substring("/uploads/".length()).replace('/', java.io.File.separatorChar);
        Path relative = Paths.get(relativeText);

        // First support the old behavior in the currently running project.
        Path cwdLegacy =
                Paths.get("uploads").toAbsolutePath().normalize().resolve(relative).normalize();
        if (Files.isRegularFile(cwdLegacy) && Files.isReadable(cwdLegacy)) {
            return copyLegacy(cwdLegacy, destination);
        }

        String userHome = System.getProperty("user.home");
        if (userHome == null || userHome.isBlank()) return null;
        for (String folder : List.of("Downloads", "Desktop")) {
            Path base = Paths.get(userHome, folder);
            if (!Files.isDirectory(base)) continue;
            Path found = findLegacyInProjectFolders(base, relative);
            if (found != null) return copyLegacy(found, destination);
        }
        return null;
    }

    private Path findLegacyInProjectFolders(Path base, Path relative) {
        // Keep recovery cheap: only inspect likely extracted e-learning project folders.
        try (var children = Files.list(base)) {
            List<Path> candidates =
                    children.filter(Files::isDirectory)
                            .filter(
                                    path ->
                                            path.getFileName()
                                                    .toString()
                                                    .toLowerCase(Locale.ROOT)
                                                    .contains("elearning"))
                            .toList();
            for (Path candidate : candidates) {
                Path found = findLegacyUnder(candidate, relative);
                if (found != null) return found;
            }
        } catch (IOException | SecurityException e) {
            log.debug("Could not list legacy media directory {}: {}", base, e.getMessage());
        }
        return null;
    }

    private Path findLegacyUnder(Path base, Path relative) {
        String fileName = relative.getFileName().toString();
        try (var stream =
                Files.find(
                        base,
                        6,
                        (path, attrs) ->
                                attrs.isRegularFile()
                                        && path.getFileName().toString().equals(fileName)
                                        && normalizedEndsWith(
                                                path, Paths.get("uploads").resolve(relative)))) {
            return stream.findFirst().orElse(null);
        } catch (IOException | SecurityException e) {
            log.debug("Could not scan legacy project directory {}: {}", base, e.getMessage());
            return null;
        }
    }

    private boolean normalizedEndsWith(Path full, Path suffix) {
        Path a = full.toAbsolutePath().normalize();
        Path b = suffix.normalize();
        if (a.getNameCount() < b.getNameCount()) return false;
        return a.subpath(a.getNameCount() - b.getNameCount(), a.getNameCount()).equals(b);
    }

    private Path copyLegacy(Path source, Path destination) {
        try {
            Files.createDirectories(destination.getParent());
            Files.copy(source, destination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Recovered legacy media file {} -> {}", source, destination);
            return destination;
        } catch (IOException e) {
            log.warn(
                    "Found legacy recording at {} but could not copy it to {}: {}",
                    source,
                    destination,
                    e.getMessage());
            return null;
        }
    }

    private String extension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot).toLowerCase(Locale.ROOT) : "";
    }

    private String extensionFromMime(String mime) {
        if (mime == null) return "";
        String type = mime.toLowerCase(Locale.ROOT);
        if (type.contains("webm")) return ".webm";
        if (type.contains("ogg")) return ".ogg";
        if (type.contains("wav")) return ".wav";
        if (type.contains("mpeg") || type.contains("mp3")) return ".mp3";
        if (type.contains("mp4") || type.contains("m4a")) return ".m4a";
        return "";
    }
}
