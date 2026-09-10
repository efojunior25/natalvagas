package com.natalvagas.service;

import com.natalvagas.domain.Category;
import com.natalvagas.dto.CategoryDTO;
import com.natalvagas.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> listAll() {
        return categoryRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public CategoryDTO toDTO(Category cat) {
        if (cat == null) return null;
        return new CategoryDTO(
                cat.getId(),
                cat.getName(),
                cat.getSlug(),
                cat.getIcon(),
                cat.getDescription()
        );
    }
}
