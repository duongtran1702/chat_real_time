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
RUN test -f src/main/resources/static/index.html \
    && sed -i 's/\r$//' gradlew \
    && chmod +x gradlew \
    && ./gradlew clean bootJar --no-daemon \
    && APP_JAR="$(find build/libs -maxdepth 1 -name '*.jar' ! -name '*-plain.jar' | head -n 1)" \
    && jar tf "$APP_JAR" | grep -q 'BOOT-INF/classes/static/index.html' \
    && cp "$APP_JAR" build/app.jar

FROM eclipse-temurin:21-jre-alpine AS runtime

RUN addgroup -S closefriend && adduser -S closefriend -G closefriend
WORKDIR /app
COPY --from=server-build /workspace/server/build/app.jar app.jar

USER closefriend
EXPOSE 8080

ENTRYPOINT ["java", "-Xms64m", "-Xmx256m", "-Xss256k", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=128m", "-XX:ReservedCodeCacheSize=48m", "-XX:ActiveProcessorCount=1", "-XX:+ExitOnOutOfMemoryError", "-jar", "/app/app.jar"]
