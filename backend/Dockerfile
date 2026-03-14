# Stage 1: Build the Go binary
FROM golang:1.22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the go.mod file
COPY go.mod ./

# Copy the source code
COPY . .

# Download dependencies
RUN go mod tidy && go mod download

# Build the application as a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/main.go

# Stage 2: Create the minimal final image
FROM alpine:latest

# Add certificates for HTTPS, tzdata for timezones, and curl for downloading migrate
RUN apk --no-cache add ca-certificates tzdata curl

# Install golang-migrate
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.0/migrate.linux-amd64.tar.gz | tar xvz && \
    mv migrate /usr/local/bin/migrate

# Set the working directory
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/main .

# Copy migrations so they are available in the container
COPY migrations ./migrations

# Copy entrypoint script and make it executable
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Initialize via entrypoint
ENTRYPOINT ["./entrypoint.sh"]
