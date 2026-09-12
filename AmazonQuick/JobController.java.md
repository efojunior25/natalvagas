# File: JobController.java
- **Original Path:** `backend/src/main/java/com/natalvagas/api/JobController.java`
- **Language / Type:** `java`
- **Lines of Code:** 57

---

```java
package com.natalvagas.api;

import com.natalvagas.domain.WorkModel;
import com.natalvagas.dto.JobCreateDTO;
import com.natalvagas.dto.JobResponseDTO;
import com.natalvagas.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
@Tag(name = "Vagas", description = "Endpoints de vagas de emprego")
public class JobController {

    private final JobService jobService;

    @GetMapping
    @Operation(summary = "Listar vagas ativas com busca e filtros")
    public ResponseEntity<Page<JobResponseDTO>> searchJobs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) WorkModel workModel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        return ResponseEntity.ok(jobService.searchJobs(query, city, workModel, pageable));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Buscar detalhes de uma vaga por slug amigável")
    public ResponseEntity<JobResponseDTO> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(jobService.getJobBySlug(slug));
    }

    @PostMapping
    @Operation(summary = "Cadastrar nova vaga (empresas/anunciantes)")
    public ResponseEntity<JobResponseDTO> createJob(@Valid @RequestBody JobCreateDTO dto) {
        JobResponseDTO created = jobService.createJob(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Aprovar vaga pendente (Curadoria/Admin)")
    public ResponseEntity<JobResponseDTO> approveJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.approveJob(id));
    }
}

```
