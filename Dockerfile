FROM node:22-alpine AS client-build

WORKDIR /workspace/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM eclipse-temurin:21-jdk-alpine AS server-build

WORKDIR /workspace/server
COPY server/ ./
COPY --from=client-build /workspace/client/dist/ src/main/resources/static/
RUN sed -i 's/\r$//' gradlew \
    && chmod +x gradlew \
    && ./gradlew clean bootJar --no-daemon \
    && cp "$(find build/libs -maxdepth 1 -name '*.jar' ! -name '*-plain.jar' | head -n 1)" build/app.jar

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S closefriend && adduser -S closefriend -G closefriend
WORKDIR /app
COPY --from=server-build /workspace/server/build/app.jar app.jar

USER closefriend
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
