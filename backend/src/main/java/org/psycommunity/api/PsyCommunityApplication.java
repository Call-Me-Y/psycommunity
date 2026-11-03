package org.psycommunity.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PsyCommunityApplication {
    public static void main(String[] args) {
        SpringApplication.run(PsyCommunityApplication.class, args);
    }
}
