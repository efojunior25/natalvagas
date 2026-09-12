# File: Dockerfile
- **Original Path:** `backend/Dockerfile`
- **Language / Type:** `text`
- **Lines of Code:** 18

---

```text
# Etapa 1: Build da aplicação Java com Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
# Baixa dependências para cache
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

# Etapa 2: Imagem final enxuta de execução
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=build /app/target/natalvagas-backend-*.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

```
