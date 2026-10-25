FROM php:8.4-cli-alpine

# Install system dependencies & CA certificates for cloud database SSL
RUN apk add --no-cache \
    git \
    curl \
    ca-certificates \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    oniguruma-dev \
    linux-headers \
    postgresql-dev

# Install PHP extensions required by Laravel, MySQL, and PostgreSQL (Supabase / Neon / Render Postgres)
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy backend files
COPY . .

# Install PHP production dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Set up storage and cache directory permissions
RUN mkdir -p /var/www/storage/framework/sessions \
             /var/www/storage/framework/views \
             /var/www/storage/framework/cache \
             /var/www/storage/logs \
             /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage /var/www/bootstrap/cache

# Expose port (Render uses dynamic $PORT, defaults to 10000)
EXPOSE 10000

ENV PHP_CLI_SERVER_WORKERS=4

# Run migration and start server automatically (No paid Render Shell needed!)
CMD sh -c "php artisan config:clear && php artisan route:clear && php artisan migrate --seed --force && php artisan serve --host=0.0.0.0 --port=\${PORT:-10000}"
