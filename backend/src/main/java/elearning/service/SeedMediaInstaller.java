package elearning.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Chép file mẫu đi kèm code (classpath seed-media/**, ví dụ audio Listening của dữ liệu demo) sang
 * thư mục upload khi khởi động. Chỉ chép file chưa có, không bao giờ ghi đè file đã tồn tại.
 * seed-media/listening/3/a.mp3 → {app.upload-dir}/listening/3/a.mp3 (audio_url "/uploads/listening/3/a.mp3").
 */
@Component
public class SeedMediaInstaller implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SeedMediaInstaller.class);
    private static final String PREFIX = "seed-media/";

    private final Path root;

    public SeedMediaInstaller(
            @Value("${app.upload-dir:${user.home}/toeic-path-data/uploads}") String dir) {
        root = Paths.get(dir).toAbsolutePath().normalize();
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        int copied = install();
        if (copied > 0) log.info("Đã chép {} file mẫu từ seed-media vào {}", copied, root);
    }

    /** Trả về số file đã chép. */
    public int install() throws IOException {
        Resource[] resources =
                new PathMatchingResourcePatternResolver().getResources("classpath*:" + PREFIX + "**/*.*");
        int copied = 0;
        for (Resource resource : resources) {
            if (!resource.isReadable()) continue;
            String url = resource.getURL().toString();
            int at = url.lastIndexOf(PREFIX);
            if (at < 0) continue;
            String relative = url.substring(at + PREFIX.length());
            if (relative.isBlank() || relative.endsWith("/") || relative.contains("..")) continue;
            Path target = root.resolve(relative).normalize();
            if (!target.startsWith(root) || Files.exists(target)) continue;
            Files.createDirectories(target.getParent());
            try (InputStream in = resource.getInputStream()) {
                Files.copy(in, target);
            }
            copied++;
        }
        return copied;
    }
}
