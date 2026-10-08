# Builds and runs the UniTrade API in a container (used by Render; optional locally).
# Stage 1 compiles the jar with the Maven wrapper; stage 2 runs it on a small Java runtime image.
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/unitrade-*.jar app.jar
EXPOSE 8080
# MaxRAMPercentage keeps the JVM inside small free-tier memory limits
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
