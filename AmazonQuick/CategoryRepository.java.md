# File: CategoryRepository.java
- **Original Path:** `backend/src/main/java/com/natalvagas/repository/CategoryRepository.java`
- **Language / Type:** `java`
- **Lines of Code:** 12

---

```java
package com.natalvagas.repository;

import com.natalvagas.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findBySlug(String slug);
}

```
