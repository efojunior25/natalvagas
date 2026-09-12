# File: Job.java
- **Original Path:** `backend/src/main/java/com/natalvagas/domain/Job.java`
- **Language / Type:** `java`
- **Lines of Code:** 126

---

```java
package com.natalvagas.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(name = "company_name", nullable = false, length = 120)
    private String companyName;

    @Column(name = "company_logo_url", length = 500)
    private String companyLogoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(nullable = false, length = 2)
    private String state;

    @Column(length = 100)
    private String neighborhood;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_model", nullable = false, length = 30)
    private WorkModel workModel;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 30)
    private ContractType contractType;

    @Column(name = "salary_min", precision = 10, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 10, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "salary_currency", length = 10)
    private String salaryCurrency;

    @Column(name = "hide_salary", nullable = false)
    private Boolean hideSalary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_channel", nullable = false, length = 30)
    private ApplicationChannel applicationChannel;

    @Column(name = "application_target", nullable = false)
    private String applicationTarget;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobStatus status;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured;

    @Column(name = "views_count", nullable = false)
    private Integer viewsCount;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (viewsCount == null) viewsCount = 0;
        if (isFeatured == null) isFeatured = false;
        if (hideSalary == null) hideSalary = true;
        if (state == null) state = "RN";
        if (city == null) city = "Natal";
        if (status == null) status = JobStatus.PENDING;
        if (salaryCurrency == null) salaryCurrency = "BRL";
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}

```
