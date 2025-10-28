# Stage 1 — Build the JAR
FROM maven:3.9.4-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only pom.xml first (for dependency caching)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build the project (skip tests to speed up build)
RUN mvn clean package -DskipTests

# Stage 2 — Run the JAR
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Copy the built JAR from the build stage
COPY --from=build /app/target/chat-app-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose application port
EXPOSE 8080

# Command to run the app
ENTRYPOINT ["java", "-jar", "app.jar"]
