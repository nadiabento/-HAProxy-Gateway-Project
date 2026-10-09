FROM mariadb:11.8
COPY master.cnf /etc/mysql/conf.d/99-master.cnf
RUN sed -i 's/\r$//' /etc/mysql/conf.d/99-master.cnf && chmod 644 /etc/mysql/conf.d/99-master.cnf
COPY init.sql /docker-entrypoint-initdb.d/