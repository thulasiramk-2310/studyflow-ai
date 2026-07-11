FROM maven:3.9.6-eclipse-temurin-17-alpine
WORKDIR /app
COPY . .
# We use spring-boot:run for development so we don't need to rebuild manually.
CMD ["mvn", "spring-boot:run"]
