import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/** Downloads and verifies the pinned ONNX sentiment model using only the JDK. */
public final class DownloadEmotionModel {
    private static final String REPOSITORY = "onnx-community/Erlangshen-Roberta-110M-Sentiment-ONNX";
    private static final String REVISION = "8cbfb8bfc81a8f5afa6a84b50d3a04a88f483d9f";
    private static final Map<String, FileSpec> FILES = files();
    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .followRedirects(HttpClient.Redirect.ALWAYS)
            .build();

    private record FileSpec(String localName, String expectedHash) {}

    private DownloadEmotionModel() {}

    public static void main(String[] args) throws Exception {
        Path output = parseOutput(args).toAbsolutePath().normalize();
        Files.createDirectories(output);
        for (Map.Entry<String, FileSpec> entry : FILES.entrySet()) {
            download(output, entry.getKey(), entry.getValue());
        }
    }

    private static Path parseOutput(String[] args) {
        if (args.length != 2 || !"--output".equals(args[0]) || args[1].isBlank()) {
            throw new IllegalArgumentException("Usage: java DownloadEmotionModel --output <model-directory>");
        }
        return Path.of(args[1]).toAbsolutePath().normalize();
    }

    private static void download(Path output, String remoteName, FileSpec spec) throws Exception {
        Path destination = output.resolve(spec.localName());
        if (Files.exists(destination)) {
            if (spec.expectedHash().equals(checksum(destination, spec.expectedHash()))) {
                System.out.println("Already present and verified: " + spec.localName());
                return;
            }
            throw new IOException("Refusing to overwrite existing file with an invalid checksum: " + destination);
        }

        Path temporary = Files.createTempFile(output, ".download-", ".tmp");
        try {
            String url = "https://huggingface.co/" + REPOSITORY + "/resolve/" + REVISION + "/" + remoteName;
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(120))
                    .header("User-Agent", "PsyCommunity-model-downloader/1.0")
                    .GET().build();
            HttpResponse<Path> response = HTTP.send(request,
                    HttpResponse.BodyHandlers.ofFile(temporary,
                            StandardOpenOption.WRITE, StandardOpenOption.TRUNCATE_EXISTING));
            if (response.statusCode() != 200) {
                throw new IOException("Download failed for " + spec.localName() + " (HTTP " + response.statusCode() + ")");
            }
            if (!spec.expectedHash().equals(checksum(temporary, spec.expectedHash()))) {
                throw new IOException("Checksum mismatch: " + spec.localName());
            }
            try {
                Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException ex) {
                Files.move(temporary, destination);
            }
            System.out.printf("Downloaded: %s (%d bytes)%n", spec.localName(), Files.size(destination));
        } finally {
            Files.deleteIfExists(temporary);
        }
    }

    private static String checksum(Path path, String expected) throws Exception {
        boolean gitLfsSha1 = expected.length() == 40;
        MessageDigest digest = MessageDigest.getInstance(gitLfsSha1 ? "SHA-1" : "SHA-256");
        if (gitLfsSha1) {
            digest.update(("blob " + Files.size(path) + "\0").getBytes(StandardCharsets.UTF_8));
        }
        try (var input = Files.newInputStream(path)) {
            byte[] buffer = new byte[1024 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) digest.update(buffer, 0, count);
        }
        return java.util.HexFormat.of().formatHex(digest.digest());
    }

    private static Map<String, FileSpec> files() {
        Map<String, FileSpec> files = new LinkedHashMap<>();
        files.put("onnx/model_quantized.onnx", new FileSpec("model.onnx", "5e0e07161a093d7134f0a3293ae6c3c6e9bae2d73c6bfbba65ae26e3a512f466"));
        files.put("tokenizer.json", new FileSpec("tokenizer.json", "15df791881f91e7963c9e0d704de2f2037baa002"));
        files.put("tokenizer_config.json", new FileSpec("tokenizer_config.json", "f10ebbb60eb4fd940ceaae54ccc075f2ef009b9f"));
        files.put("special_tokens_map.json", new FileSpec("special_tokens_map.json", "a8b3208c2884c4efb86e49300fdd3dc877220cdf"));
        files.put("vocab.txt", new FileSpec("vocab.txt", "ca4f9781030019ab9b253c6dcb8c7878b6dc87a5"));
        files.put("config.json", new FileSpec("config.json", "e32e48f6b38bacacc490d1cc8c71e649e71d005f"));
        return Map.copyOf(files);
    }
}
