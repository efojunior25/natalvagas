package com.natalvagas.dto;

public record CategoryDTO(
    Long id,
    String name,
    String slug,
    String icon,
    String description
) {}
