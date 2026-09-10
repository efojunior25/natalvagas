package com.natalvagas.dto;

import com.natalvagas.domain.ApplicationChannel;
import com.natalvagas.domain.ContractType;
import com.natalvagas.domain.JobStatus;
import com.natalvagas.domain.WorkModel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record JobResponseDTO(
    Long id,
    String title,
    String slug,
    String companyName,
    String companyLogoUrl,
    CategoryDTO category,
    String city,
    String state,
    String neighborhood,
    WorkModel workModel,
    ContractType contractType,
    BigDecimal salaryMin,
    BigDecimal salaryMax,
    String salaryCurrency,
    Boolean hideSalary,
    String description,
    String requirements,
    String benefits,
    ApplicationChannel applicationChannel,
    String applicationTarget,
    JobStatus status,
    Boolean isFeatured,
    Integer viewsCount,
    OffsetDateTime publishedAt,
    OffsetDateTime createdAt
) {}
