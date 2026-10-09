FROM php:8.2-fpm-alpine
RUN apk add --no-cache nginx curl && docker-php-ext-install pdo_mysql
COPY nginx.conf /etc/nginx/nginx.conf
COPY src/ /var/www/html/
WORKDIR /var/www/html
EXPOSE 8080
CMD ["sh", "-c", "php-fpm -D && nginx -g 'daemon off;'"]