# File: SitemapController.java
- **Original Path:** `backend/src/main/java/com/natalvagas/api/SitemapController.java`
- **Language / Type:** `java`
- **Lines of Code:** 52

---

```java
package com.natalvagas.api;

import com.natalvagas.dto.JobResponseDTO;
import com.natalvagas.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "SEO & Sitemap", description = "Geração dinâmica de Sitemap XML para Google Search e Google Jobs")
public class SitemapController {

    private final JobService jobService;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Operation(summary = "Gerar sitemap dinâmico com todas as vagas ativas")
    public String getSitemap() {
        List<JobResponseDTO> jobs = jobService.getJobsForSitemap();
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Página Inicial
        xml.append("  <url>\n");
        xml.append("    <loc>https://natalvagas.com.br/</loc>\n");
        xml.append("    <changefreq>hourly</changefreq>\n");
        xml.append("    <priority>1.0</priority>\n");
        xml.append("  </url>\n");

        // URLs das Vagas Ativas
        for (JobResponseDTO job : jobs) {
            xml.append("  <url>\n");
            xml.append("    <loc>https://natalvagas.com.br/vaga/").append(job.slug()).append("</loc>\n");
            if (job.publishedAt() != null) {
                xml.append("    <lastmod>").append(job.publishedAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)).append("</lastmod>\n");
            }
            xml.append("    <changefreq>daily</changefreq>\n");
            xml.append("    <priority>0.8</priority>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");
        return xml.toString();
    }
}

```
