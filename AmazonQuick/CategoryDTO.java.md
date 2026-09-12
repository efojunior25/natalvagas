# File: CategoryDTO.java
- **Original Path:** `backend/src/main/java/com/natalvagas/dto/CategoryDTO.java`
- **Language / Type:** `java`
- **Lines of Code:** 9

---

```java
package com.natalvagas.dto;

public record CategoryDTO(
    Long id,
    String name,
    String slug,
    String icon,
    String description
) {}

```
