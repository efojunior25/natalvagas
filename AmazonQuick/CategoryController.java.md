# File: CategoryController.java
- **Original Path:** `backend/src/main/java/com/natalvagas/api/CategoryController.java`
- **Language / Type:** `java`
- **Lines of Code:** 28

---

```java
package com.natalvagas.api;

import com.natalvagas.dto.CategoryDTO;
import com.natalvagas.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Tag(name = "Categorias", description = "Endpoints de categorias de vagas")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Listar todas as categorias de vagas")
    public ResponseEntity<List<CategoryDTO>> listAll() {
        return ResponseEntity.ok(categoryService.listAll());
    }
}

```
