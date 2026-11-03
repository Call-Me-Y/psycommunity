package org.psycommunity.api.web;

import org.psycommunity.api.service.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
public class UploadedFileController {
    private final Path uploadRoot;

    public UploadedFileController(@Value("${app.upload-dir}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/uploads/{category}/{filename:.+}")
    public ResponseEntity<Resource> uploadedFile(@PathVariable String category, @PathVariable String filename) {
        if (!List.of("avatars", "postimages", "messageimages", "files", "surveyimages").contains(category)
                || filename.contains("/") || filename.contains("\\")) {
            throw missingFile();
        }
        try {
            Path file = uploadRoot.resolve(category).resolve(filename).normalize();
            if (!file.startsWith(uploadRoot) || !Files.isRegularFile(file)) throw missingFile();
            Resource resource = new UrlResource(file.toUri());
            String type = Files.probeContentType(file);
            MediaType mediaType = type == null ? MediaType.APPLICATION_OCTET_STREAM : MediaType.parseMediaType(type);
            return ResponseEntity.ok().contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .body(resource);
        } catch (IOException ex) {
            throw missingFile();
        }
    }

    private static ApiException missingFile() {
        return new ApiException(HttpStatus.NOT_FOUND, "文件不存在");
    }
}
