package elearning.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class MediaStorageService {
    private static final Logger log = LoggerFactory.getLogger(MediaStorageService.class);
    private static final List<String> ALLOWED_EXTENSIONS =
            List.of(".mp3", ".wav", ".m4a", ".webm", ".ogg");
    private static final List<String> IMAGE_EXTENSIONS = List.of(".jpg", ".jpeg", ".png", ".webp");
    private final Path root;

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
                        "Recording file is missing. storedUrl={}, expectedPath={}",
                        storedUrl,
                        path);
                throw new IllegalArgumentException("Không tìm thấy file ghi âm trên máy chủ");
            }
            return resource;
        } catch (java.net.MalformedURLException e) {
            throw new IllegalArgumentException("Không thể đọc file ghi âm", e);
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
