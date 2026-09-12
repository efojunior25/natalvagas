# File: JobService.java
- **Original Path:** `backend/src/main/java/com/natalvagas/service/JobService.java`
- **Language / Type:** `java`
- **Lines of Code:** 177

---

```java
package com.natalvagas.service;

import com.natalvagas.domain.Category;
import com.natalvagas.domain.Job;
import com.natalvagas.domain.JobStatus;
import com.natalvagas.domain.WorkModel;
import com.natalvagas.dto.CategoryDTO;
import com.natalvagas.dto.JobCreateDTO;
import com.natalvagas.dto.JobResponseDTO;
import com.natalvagas.repository.CategoryRepository;
import com.natalvagas.repository.JobRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    @Transactional(readOnly = true)
    public Page<JobResponseDTO> searchJobs(String query, String city, WorkModel workModel, Pageable pageable) {
        Specification<Job> spec = (root, q, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Apenas vagas aprovadas
            predicates.add(cb.equal(root.get("status"), JobStatus.APPROVED));

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase()));
            }

            if (workModel != null) {
                predicates.add(cb.equal(root.get("workModel"), workModel));
            }

            if (query != null && !query.isBlank()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate companyMatch = cb.like(cb.lower(root.get("companyName")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                Predicate neighborhoodMatch = cb.like(cb.lower(root.get("neighborhood")), pattern);

                predicates.add(cb.or(titleMatch, companyMatch, descMatch, neighborhoodMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return jobRepository.findAll(spec, pageable).map(this::toDTO);
    }

    @Transactional
    public JobResponseDTO getJobBySlug(String slug) {
        Job job = jobRepository.findBySlugAndStatus(slug, JobStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("Vaga não encontrada"));

        job.setViewsCount(job.getViewsCount() + 1);
        jobRepository.save(job);
        return toDTO(job);
    }

    @Transactional
    public JobResponseDTO createJob(JobCreateDTO dto) {
        Category category = null;
        if (dto.categoryId() != null) {
            category = categoryRepository.findById(dto.categoryId()).orElse(null);
        }

        String baseSlug = toSlug(dto.title() + " " + dto.city());
        String uniqueSlug = baseSlug + "-" + UUID.randomUUID().toString().substring(0, 6);

        Job job = Job.builder()
                .title(dto.title().trim())
                .slug(uniqueSlug)
                .companyName(dto.companyName().trim())
                .companyLogoUrl(dto.companyLogoUrl())
                .category(category)
                .city(dto.city().trim())
                .state(dto.state() != null ? dto.state().trim() : "RN")
                .neighborhood(dto.neighborhood() != null ? dto.neighborhood().trim() : null)
                .workModel(dto.workModel())
                .contractType(dto.contractType())
                .salaryMin(dto.salaryMin())
                .salaryMax(dto.salaryMax())
                .hideSalary(dto.hideSalary() != null ? dto.hideSalary() : true)
                .description(dto.description().trim())
                .requirements(dto.requirements())
                .benefits(dto.benefits())
                .applicationChannel(dto.applicationChannel())
                .applicationTarget(dto.applicationTarget().trim())
                .status(JobStatus.APPROVED)
                .isFeatured(false)
                .sourceUrl(dto.sourceUrl())
                .publishedAt(OffsetDateTime.now())
                .build();

        Job saved = jobRepository.save(job);
        return toDTO(saved);
    }

    @Transactional
    public JobResponseDTO approveJob(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vaga não encontrada com ID: " + id));

        job.setStatus(JobStatus.APPROVED);
        job.setPublishedAt(OffsetDateTime.now());
        return toDTO(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public List<JobResponseDTO> getJobsForSitemap() {
        return jobRepository.findTop1000ByStatusOrderByPublishedAtDesc(JobStatus.APPROVED)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public JobResponseDTO toDTO(Job job) {
        if (job == null) return null;
        CategoryDTO catDTO = job.getCategory() != null ? categoryService.toDTO(job.getCategory()) : null;

        return new JobResponseDTO(
                job.getId(),
                job.getTitle(),
                job.getSlug(),
                job.getCompanyName(),
                job.getCompanyLogoUrl(),
                catDTO,
                job.getCity(),
                job.getState(),
                job.getNeighborhood(),
                job.getWorkModel(),
                job.getContractType(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getSalaryCurrency(),
                job.getHideSalary(),
                job.getDescription(),
                job.getRequirements(),
                job.getBenefits(),
                job.getApplicationChannel(),
                job.getApplicationTarget(),
                job.getStatus(),
                job.getIsFeatured(),
                job.getViewsCount(),
                job.getPublishedAt(),
                job.getCreatedAt()
        );
    }

    public static String toSlug(String input) {
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-+", "-").replaceAll("^-|-$", "");
    }
}

```
