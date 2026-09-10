package com.natalvagas.dto;

import com.natalvagas.domain.ApplicationChannel;
import com.natalvagas.domain.ContractType;
import com.natalvagas.domain.WorkModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record JobCreateDTO(
    @NotBlank(message = "O título da vaga é obrigatório")
    @Size(max = 150)
    String title,

    @NotBlank(message = "O nome da empresa é obrigatório")
    @Size(max = 120)
    String companyName,

    String companyLogoUrl,

    Long categoryId,

    @NotBlank(message = "A cidade é obrigatória")
    String city,

    String state,

    String neighborhood,

    @NotNull(message = "O modelo de trabalho é obrigatório")
    WorkModel workModel,

    @NotNull(message = "O tipo de contrato é obrigatório")
    ContractType contractType,

    BigDecimal salaryMin,
    BigDecimal salaryMax,
    Boolean hideSalary,

    @NotBlank(message = "A descrição da vaga é obrigatória")
    String description,

    String requirements,
    String benefits,

    @NotNull(message = "O canal de candidatura é obrigatório")
    ApplicationChannel applicationChannel,

    @NotBlank(message = "O alvo de candidatura (link/email/whatsapp) é obrigatório")
    String applicationTarget,

    String sourceUrl
) {}
