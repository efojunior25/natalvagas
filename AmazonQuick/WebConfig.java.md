# File: WebConfig.java
- **Original Path:** `backend/src/main/java/com/natalvagas/config/WebConfig.java`
- **Language / Type:** `java`
- **Lines of Code:** 24

---

```java
package com.natalvagas.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${natalvagas.cors.allowed-origins:http://localhost:5173,https://natalvagas.com.br,https://www.natalvagas.com.br}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins.split(",");
        registry.addMapping("/**")
                .allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}

```
