# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

LABEL org.opencontainers.image.title="StudyFlow AI Auth Service Builder" \
      org.opencontainers.image.description="Builder image for Auth Service" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Copy pom.xml and download dependencies (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine

LABEL org.opencontainers.image.title="StudyFlow AI Auth Service" \
      org.opencontainers.image.description="Auth Service for StudyFlow AI" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy the built jar from the builder stage
COPY --from=builder /app/target/auth-service-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "app.jar"]
