package org.psycommunity.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final String ALGORITHM = "HmacSHA256";
    private final ObjectMapper mapper;
    private final byte[] secret;
    private final Duration ttl;

    public JwtService(ObjectMapper mapper,
                      @Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.ttl:7d}") Duration ttl) {
        this.mapper = mapper;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.ttl = ttl;
    }

    public String create(String uid, int type) {
        try {
            String header = encode(mapper.writeValueAsBytes(Map.of("alg", "HS256", "typ", "JWT")));
            Map<String, Object> claims = new LinkedHashMap<>();
            claims.put("uid", uid);
            claims.put("type", type);
            claims.put("exp", Instant.now().plus(ttl).getEpochSecond());
            String payload = encode(mapper.writeValueAsBytes(claims));
            String unsigned = header + "." + payload;
            return unsigned + "." + sign(unsigned);
        } catch (Exception ex) {
            throw new IllegalStateException("无法创建登录令牌", ex);
        }
    }

    public Map<String, Object> read(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) throw invalid();
            String unsigned = parts[0] + "." + parts[1];
            if (!constantTimeEquals(sign(unsigned), parts[2])) throw invalid();
            Map<String, Object> claims = mapper.readValue(
                    Base64.getUrlDecoder().decode(parts[1]), new TypeReference<>() {});
            Object uid = claims.get("uid");
            Object exp = claims.get("exp");
            Object type = claims.get("type");
            if (!(uid instanceof String) || !(exp instanceof Number) || !(type instanceof Number)) throw invalid();
            if (((Number) exp).longValue() <= Instant.now().getEpochSecond()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "登录令牌已过期");
            }
            return claims;
        } catch (ApiException ex) {
            throw ex;
        } catch (Exception ex) {
            throw invalid();
        }
    }

    private String sign(String value) throws Exception {
        Mac mac = Mac.getInstance(ALGORITHM);
        mac.init(new SecretKeySpec(secret, ALGORITHM));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
    }

    private static String encode(byte[] value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static boolean constantTimeEquals(String left, String right) {
        return java.security.MessageDigest.isEqual(left.getBytes(StandardCharsets.US_ASCII), right.getBytes(StandardCharsets.US_ASCII));
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "登录令牌无效");
    }
}
